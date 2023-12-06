
import { db, auth,  firebase } from '../../../firebase_config';

import SideBar from '../../../components/SideNav';

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, getDocs, limit, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';
import { writeBatch } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TEST_ID } from 'react-native-gifted-chat';

export default function Message({navigation}) {
  const [chatSummaries, setChatSummaries] = useState([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [userRating, setUserRating] = useState('');
  const [userMessage, setUserMessage] = useState('');

const auth = getAuth();
const currentUser = auth.currentUser;

const handleSearch = async (text) => {
const searchText = text.toLowerCase();
setSearchQuery(searchText);

if (searchText.trim() === '') {
  setSearchResults([]);
  return;
}

const usersRef = collection(db, 'users');
const q = query(usersRef);
const querySnapshot = await getDocs(q);


if (!querySnapshot.empty) {
  const users = [];
  querySnapshot.forEach((doc) => {
    const userData = doc.data();
    // Ensure userData.email exists before using includes method
    if (userData.email && userData.email.toLowerCase().includes(searchText)) {
      users.push(userData);
    }
  });
  setSearchResults(users);
} else {
  console.error("No users found for the search query:", searchText);
}
}

const handleLongPress = (chat) => {
setSelectedChat(chat);
setOptionModalVisible(true);
};

const handleUserSelect = async (selectedEmail) => {
setSearchModalVisible(false);

// Check if currentUser is defined
if (!currentUser) {
  console.error("Current user is undefined.");
  return;
}

const existingChat = chatSummaries.find((chat) =>
  chat.otherParticipantEmail === selectedEmail
);

if (existingChat) {
  navigation.navigate('chatView', { chatId: existingChat.chatId, receiverEmail: selectedEmail });
} else {
  const newChatRef = collection(db, 'chats');
  const newChat = {
    users: [currentUser.email, selectedEmail],
    messages: [],
  };

  try {
    const docRef = await addDoc(newChatRef, newChat);
    navigation.navigate('chatView', { chatId: docRef.id, receiverEmail: selectedEmail });
  } catch (error) {
    console.error('Error creating a new chat:', error);
  }
}
};

useEffect(() => {
if (currentUser) {
  const chatsRef = collection(db, 'chats');
  const unsubscribeChats = onSnapshot(chatsRef, (querySnapshot) => {
    const allChats = [];

    querySnapshot.forEach((doc) => {
      const userData = doc.data();

      if (userData && userData.users && userData.users.includes(currentUser.email)) {
        allChats.push({
          ...doc.data(),
          chatId: doc.id,
        });
      }
    });

    Promise.all(
      allChats.map(async (chat) => {
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, where('chatId', '==', chat.chatId), orderBy('timestamp', 'desc'), limit(1));
        const messagesSnapshot = await getDocs(q);

        if (!messagesSnapshot.empty) {
          const lastMessageData = messagesSnapshot.docs[0]?.data();
          const lastMessageTimestamp = lastMessageData?.timestamp
            ? new Date(lastMessageData.timestamp.seconds * 1000)
            : new Date(0);

          let lastMessageText = lastMessageData?.imageUrl ? 'Photo attached' : lastMessageData?.text || '';

          return {
            chatId: chat.chatId,
            otherParticipantEmail: chat.users.find((email) => email !== currentUser.email),
            lastMessage: lastMessageText,
            timestamp: lastMessageTimestamp,
          };
        } else {
          return {
            chatId: chat.chatId,
            otherParticipantEmail: chat.users.find((email) => email !== currentUser.email),
            lastMessage: 'No messages yet',
            timestamp: new Date(0),
          };
        }
      })
    ).then((chatSummaries) => {
      chatSummaries.sort((a, b) => b.timestamp - a.timestamp);
      setChatSummaries(chatSummaries);
    });
  });

  return () => unsubscribeChats();
}
}, [currentUser]); 
console.log('chatSummaries:', chatSummaries);

const renderItem = ({ item }) => (
  <TouchableOpacity
    style={[styles.itemContainer, styles.itemShadow]}
    onPress={() => navigation.navigate('chatView', { chatId: item.chatId, receiverEmail: item.otherParticipantEmail })}
    onLongPress={() => handleLongPress(item)} 
  >
    <View style={[styles.avatarContainer, styles.itemShadow]}>
      <Icon name="user" size={40} color="#05652D" />
    </View>
    <View style={styles.textAndTimestampContainer}>
      <Text style={styles.emailText}>{item.otherParticipantEmail}</Text>
      <Text style={styles.lastMessageText} numberOfLines={1} ellipsizeMode="tail">{item.lastMessage}</Text>
      <Text style={styles.timestampText}>{item.timestamp.toLocaleTimeString()}</Text>
    </View>
  </TouchableOpacity>
);

return (
  <View style={styles.container}>
  {/* Search Bar */}
  <TextInput
    style={styles.searchBar}
    placeholder="Search users"
    value={searchQuery}
    onChangeText={handleSearch}
  />

  {/* Display Search Results */}
  <FlatList
    data={searchResults}
    renderItem={({ item }) => (
      <TouchableOpacity onPress={() => handleUserSelect(item.email)}>
        <View style={styles.searchResultItem}>
          <Text>{item.email}</Text>
        </View>
      </TouchableOpacity>
    )}
    keyExtractor={(item) => item.email}
    ListHeaderComponent={<Text>Search Results</Text>}
    ListEmptyComponent={<Text>No results found</Text>}
  />

  {/* Display Chat Summaries */}
  <FlatList
    data={chatSummaries}
    renderItem={renderItem}
    keyExtractor={(item) => item.chatId}
    ListHeaderComponent={<Text>Chat Summaries</Text>}
  />

  {/* Floating Button */}
  <TouchableOpacity
    style={{ position: 'absolute', bottom: 20, right: 20 }}
    onPress={() => navigation.navigate('createMessage')}
  >
    <View style={styles.floatingButton}>
      <Ionicons name="pencil" style={styles.floatingButtonIcon} />
    </View>
  </TouchableOpacity>
</View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light background color
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Light border color
    backgroundColor: '#FFFFFF', // Card background color
    borderRadius: 8, // Add some border radius for a card-like appearance
    margin: 8, // Add margin between chat items
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50', // Green color for avatar background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textAndTimestampContainer: {
    flex: 1,
  },
  emailText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333', // Dark text color
  },
  lastMessageText: {
    fontSize: 16,
    color: '#555555', // Slightly lighter text color
  },
  timestampText: {
    fontSize: 14,
    color: '#888888', // Lighter timestamp text color
    marginTop: 8,
  },
  searchBar: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    margin: 8,
    paddingLeft: 8,
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgb(20, 120, 2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtonIcon: {
    fontSize: 35,
    color: '#ffffff',
  },
});