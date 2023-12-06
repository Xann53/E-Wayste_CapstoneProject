import { db, auth, firebase } from '../../../firebase_config';
import SideNav from '../../../components/SideNav';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image,ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, getDocs, limit, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';
import { writeBatch } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TEST_ID } from 'react-native-gifted-chat';

export default function Message({ navigation }) {
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
  };

  const handleLongPress = (chat) => {
    setSelectedChat(chat);
    setOptionModalVisible(true);
  };

  const toggleSideBar = () => {
    setOpenSideBar(!openSideBar);
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
              // No messages, so exclude this chat from chat summaries
              return null;
            }
          })
        ).then((chatSummaries) => {
          // Filter out chats where there are no messages
          const filteredChatSummaries = chatSummaries.filter(Boolean);
          filteredChatSummaries.sort((a, b) => b.timestamp - a.timestamp);
          setChatSummaries(filteredChatSummaries);
        });
      });
      return () => unsubscribeChats();
    }
  }, [currentUser]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemContainer, styles.itemShadow]}
      onPress={() => navigation.navigate('chatView', { chatId: item.chatId, receiverEmail: item.otherParticipantEmail })}
      onLongPress={() => handleLongPress(item)}
    >
      <View style={[styles.avatarContainer, styles.itemShadow]}>
        <Icon name="user" size={30} color="#05652D" />
      </View>
      <View style={styles.textAndTimestampContainer}>
        <Text style={styles.emailText}>{item.otherParticipantEmail}</Text>
        <Text style={styles.lastMessageText} numberOfLines={1} ellipsizeMode="tail">{item.lastMessage}</Text>
        <Text style={styles.timestampText}>{item.timestamp.toLocaleTimeString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {/* Search Bar */}
          <TextInput
            style={styles.searchBar}
            placeholder="Search users"
            value={searchQuery}
            onChangeText={handleSearch}
          />

          {/* Display Chat Summaries */}
          <View style={styles.chatSummariesContainer}>
            <Text style={styles.listChatHeader}>Messages</Text>
            <FlatList
              data={chatSummaries}
              renderItem={renderItem}
              keyExtractor={(item) => item.chatId}
              ListHeaderComponent={<View />} // Empty header to ensure the list starts below the search bar
            />
          </View>

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
            ListHeaderComponent={<Text style={styles.searchItemText}>Search Results</Text>}
            ListEmptyComponent={<Text style={styles.searchItemText}>No results found</Text>}
          />
        </View>
      </ScrollView>

      <View style={styles.containerHeader}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity activeOpacity={0.5} onPress={() => { setOpenSideBar(true) }}>
              <Ionicons name='menu' style={{ fontSize: 40, color: '#ffffff', top: 2 }} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: 600, color: '#ffffff', top: 1 }}>Message</Text>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
            <TouchableOpacity activeOpacity={0.5}>
              <Ionicons name='search' style={{ fontSize: 35, color: '#ffffff', top: 3 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgb(75,163,84)', zIndex: -99 }}>
        <Image
          source={require('../../../assets/NatureVector.jpg')}
          style={{
            position: 'absolute',
            resizeMode: 'stretch',
            width: '100%',
            height: '100%',
            opacity: 0.3,
            bottom: 0,
          }}
        />
      </View>

      <View style={{
        position: 'absolute',
        zIndex: 98,
        bottom: 80,
        right: 25,
        height: 60,
        width: 60,
        borderRadius: 100,
        backgroundColor: 'rgb(13, 86, 1)',
        overflow: 'hidden',
      }}>
        <TouchableOpacity style={{ width: '100%', height: '100%' }} onPress={() => { navigation.navigate('createMessage') }}>
          <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(20, 120, 2)' }}>
            <Ionicons name='pencil' style={{ fontSize: 35, color: '#ffffff' }} />
          </View>
        </TouchableOpacity>
      </View>

      {openSideBar && (
        <View style={{ position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99 }}>
          <TouchableOpacity style={{ position: 'absolute', left: 20, top: 30, zIndex: 150 }} onPress={() => { setOpenSideBar(false) }}>
            <Ionicons name='arrow-back' style={{ fontSize: 40, color: 'rgb(81,175,91)' }} />
          </TouchableOpacity>
          <SideNav navigation={navigation} />
          <TouchableOpacity style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0)', zIndex: -1 }} onPress={() => { setOpenSideBar(false) }} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F5F5F5', // Light background color
  },
  searchBar: {
    height: 40,
    margin: 10,
    paddingLeft: 8,
    borderColor: 'green', // Border color for the search bar
    borderWidth: 1,
    borderRadius: 1000
  },
  chatSummariesContainer: {
    zIndex: 1, // Ensure the chat summaries are above the search results
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12, // Adjust padding
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Light border color
    backgroundColor: '#E5F7E7', // Card background color
    borderRadius: 8, // Add some border radius for a card-like appearance
    margin: 8, // Add margin between chat items
  },
  avatarContainer: {
    width: 48, // Adjust width
    height: 48, // Adjust height
    borderRadius: 24, // Adjust border radius
    backgroundColor: '#4CAF50', // Green color for avatar background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12, // Adjust margin
  },
  textAndTimestampContainer: {
    flex: 1,
  },
  emailText: {
    fontSize: 16, // Adjust font size
    fontWeight: 'bold',
    color: '#333333', // Dark text color
  },
  lastMessageText: {
    fontSize: 14, // Adjust font size
    color: '#555555', // Slightly lighter text color
  },
  timestampText: {
    fontSize: 12, // Adjust font size
    color: '#888888', // Lighter timestamp text color
    marginTop: 6, // Adjust margin top
  },
  listChatHeader: {
    fontSize: 18, // Adjust font size
    fontWeight: 'bold',
    marginLeft: 10,
    color: 'green',
    marginBottom: 8, // Optional: Add margin bottom if needed
  },
  searchItemContainer: {
    position: 'absolute',
    top: 90, // Adjust the distance from the searchBar
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  searchItemText: {
    marginHorizontal: 10,
  },
  searchResultItem: {
    marginHorizontal: 10,
  },
});