const { Server } = require("socket.io");
const userModel = require("../models/user.model");
const messageModel = require("../models/message.model");
// map to the online user
const onlineUsers = new Map();

// map to track typing status -> userId -> [conversation] : boolean
const typingUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
    },
    pingTimeout: 60000, // DISCONNECT
  });

  // when a new socket connection is established
  io.on("connection", (socket) => {
    console.log(`user connect with id: ${socket.id}`);
    let userId = null;

    // handle user connection and mark them online on DB
    socket.on("user_connected", async (connectingUserId) => {
      try {
        userId = connectingUserId;
        onlineUsers.set(userId, socket.id);
        socket.join(userId); // join for personal room for direct emits

        // Update user status in db
        await userModel.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });
        io.emit("user_status", { userId, isOnline: true });
      } catch (err) {
        console.error("error handleing user connection ", err.message);
      }
    });

    //return online status of requested user
    socket.on("get_user_status", (requestedUserId, callback) => {
      const isOnline = onlineUsers.has(requestedUserId);
      callback({
        userId: requestedUserId,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    socket.on("send_message", async (message) => {
      try {
        const receiverSockedId = onlineUsers.get(message.receiver?.id);
        if (receiverSockedId) {
          io.to(receiverSockedId).emit("receive_message", message);
        }
      } catch (err) {
        console.error("Error sending message", err.message);
        socket.emit("message_error ", { error: "Failed to error message." });
      }
    });

    // update message as read and notify sender
    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        await messageModel.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } },
        );
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          messageIds.forEach((messageId) => {
            io.to(senderSocketId).emit("message_status_update", {
              messageId,
              messageStatus: "read",
            });
          });
        }
      } catch (err) {
        console.error("Error updating message read status.", err.message);
      }
    });

    // handle typing start event and auto stop after 3s
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;
      if (!typingUsers.has(userId)) typingUsers.set(userId, {});

      const userTyping = typingUsers.get(userId);
      userTyping[conversationId] = true;

      // clear any existing timeout
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }

      // auto-stop after 3s
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        socket.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      // Notify receiver
      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (typingUsers.has(userId)) {
        const userTyping = typingUsers.get(userId);
        userTyping[conversationId] = false;
        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTyping[`${conversationId}_timeout`];
        }
      }

      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    // Add or update reaction on message
    socket.on(
      "add_reaction",
      async ({ messageId, emoji, userId, reactionUserId }) => {
        try {
          const message = await messageModel.findById(messageId);
          if (!message) return;

          const existingReactionIndex = message.reaction.findIndex(
            (r) => r.user.toString() === reactionUserId,
          );

          if (existingReactionIndex > -1) {
            const existing = message.reaction[existingReactionIndex];
            if (existing.emoji === emoji) {
              // same reaction exists, remove it (toggle off)
              message.reaction.splice(existingReactionIndex, 1);
            } else {
              // update to new emoji
              message.reaction[existingReactionIndex].emoji = emoji;
            }
          } else {
            message.reaction.push({ user: reactionUserId, emoji });
          }
          await message.save();

          const populateMessage = await messageModel
            .findOne(message._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username, profilePicture")
            .populate("reaction.user", "username");

          const reactionUpdate = {
            messageId,
            reactions: populateMessage.reactions,
          };

          const senderSocket = onlineUsers.get(
            populateMessage.sender._id.toString(),
          );
          const receiverSocket = onlineUsers.get(
            populateMessage.receiver._id.toString(),
          );

          if (senderSocket) {
            io.to(senderSocket).emit("reaction_update", reactionUpdate);
          }
          if (receiverSocket) {
            io.to(receiverSocket).emit("reaction_update", reactionUpdate);
          }
        } catch (err) {
          console.error("Error adding reaction", err.message);
        }
      },
    );

    // handle socket disconnection and mark user offline on DB
    const handleDisconnected = async (socket) => {
      if (!userId) return;

      try {
        onlineUsers.delete(userId);

        // clear all timeouts
        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) {
              clearTimeout(userTyping[key]);
            }
          });
          typingUsers.delete(userId);
        }
        await userModel.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });
        socket.leave(userId); // leave personal room
        console.log(`user disconnected with id: ${socket.id}`);
      } catch (err) {
        console.error("error handling user disconnection ", err.message);
      }
    };

    // disconnect event
    socket.on("disconnect", handleDisconnected);
  });
  // attach the online user map to the socket use for external user
  io.socket.UserMap = onlineUsers;
  return io;
};

module.exports = initializeSocket;
