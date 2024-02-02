import React, { useState, useEffect } from 'react';
import { db, auth, firebase } from '../../firebase_config';
import { useIsFocused } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, Image, ScrollView } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, getDocs, limit, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';
import { writeBatch } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function Message({navigation}) {
  const isFocused = useIsFocused(); 
  const [chatSummaries, setChatSummaries] = useState([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [refreshPage, setRefreshPage] = useState(false);  


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
  const q = query(usersRef, where('accountType', 'in', ['Garbage Collector', 'LGU / Waste Management Head']));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const users = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (
        (userData.username && userData.username.toLowerCase().includes(searchText)) ||
        (userData.email && userData.email.toLowerCase().includes(searchText)) ||
        (userData.municipality && userData.municipality.toLowerCase().includes(searchText)) ||
        (userData.barangay && userData.barangay.toLowerCase().includes(searchText))
      ) {
        users.push(userData);
      }
    });
    setSearchResults(users);
  } else {
    console.error("No users found for the search query:", searchText);
  }
};

const refreshPageAndClearForms = async () => {
  setSearchQuery('');
  setSearchResults([]);
  setSelectedChat(null);
  setUserMessage('');
  setRefreshPage((prev) => !prev);
};


const handleLongPress = (chat) => {
  setSelectedChat(chat);
  setOptionModalVisible(true);
};

const handleDeleteChat = async () => {
  setOptionModalVisible(false); // Close the option modal

  if (!selectedChat) {
    console.error("No chat selected for deletion.");
    return;
  }

  const chatId = selectedChat.chatId;

  try {
    // Delete messages associated with the chat
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(messagesRef, where('chatId', '==', chatId));
    const messagesSnapshot = await getDocs(messagesQuery);

    const batch = writeBatch(db);
    messagesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Delete the chat document from the 'chats' collection
    await deleteDoc(doc(db, 'chats', chatId));

    // Update UI state
    setRefreshPage((prev) => !prev);
  } catch (error) {
    console.error('Error deleting chat:', error);
  }
};

const handleUserSelect = async (selectedEmail) => {
  setSearchModalVisible(false);

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
      refreshPageAndClearForms();
    } catch (error) {
      console.error('Error creating a new chat:', error);
    }
  }
};


useEffect(() => {
  const unsubscribeChats = currentUser
    ? onSnapshot(
        collection(db, 'chats'),
        async (querySnapshot) => {
          const allChats = [];

          for (const doc of querySnapshot.docs) {
            const userData = doc.data();

            if (userData && userData.users && userData.users.includes(currentUser.email)) {
              const messagesRef = collection(db, 'messages');
              const q = query(messagesRef, where('chatId', '==', doc.id), orderBy('timestamp', 'desc'), limit(1));
              const messagesSnapshot = await getDocs(q);

              if (!messagesSnapshot.empty) {
                const lastMessageData = messagesSnapshot.docs[0]?.data();
                const lastMessageTimestamp = lastMessageData?.timestamp?.toDate();

                let lastMessageText = lastMessageData?.imageUrl ? 'Photo attached' : lastMessageData?.text || '';

                allChats.push({
                  chatId: doc.id,
                  otherParticipantEmail: userData.users.find((email) => email !== currentUser.email),
                  lastMessage: lastMessageText,
                  timestamp: lastMessageTimestamp,
                });
              }
            }
          }

          allChats.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setChatSummaries(allChats);
        },
        (error) => {
          console.error('Error fetching chats:', error);
        }
      )
    : undefined;

  return () => {
    if (unsubscribeChats) {
      unsubscribeChats();
    }
  };
}, [currentUser, refreshPage, chatSummaries]);


const renderItem = ({ item }) => (
  <TouchableOpacity
    style={[styles.itemContainer, styles.itemShadow]}
    onPress={() => navigation.navigate('chatView', { chatId: item.chatId, receiverEmail: item.otherParticipantEmail })}
    onLongPress={() => handleLongPress(item)} 
  >
    <View style={[styles.avatarContainer, styles.itemShadow]}>
      <Icon name="user" size={25} color="#05652D" />
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
    <View style={styles.containerHeader}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15 }}>
          <Text style={{ fontSize: 20, fontWeight: 600, color: '#ffffff', top: 25 }}>Message</Text>
        </View>
      </View>
    </View>
    <View style={styles.containerSearch}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search users"
        value={searchQuery}
        onChangeText={handleSearch}
      />
    </View>
    {/* Background Image */}
    <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgb(75,163,84)', zIndex: -99 }}>
      <Image
        source={require('../../assets/NatureVector.jpg')}
        style={{
          position: 'absolute',
          resizeMode: 'stretch',
          width: '100%',
          height: '100%',
          opacity: 0.5, // Set opacity to 50%
          bottom: 0,
        }}
      />
    </View>
    {/* Display Search Results */}
    {searchQuery.length > 0 && searchResults.length > 0 && (
      <React.Fragment>
        <Text style={styles.headerText}>Search Results</Text>
        <FlatList
          data={searchResults}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleUserSelect(item.email)}>
              <View style={styles.searchResultItem}>
                <Text>{item.username}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.email}
          ListEmptyComponent={<Text>No results found</Text>}
        />
      </React.Fragment>
    )}
    {/* Display Chat Summaries */}
    <FlatList
      data={chatSummaries}
      renderItem={renderItem}
      keyExtractor={(item) => item.chatId}
    />
    <Modal
      animationType="slide"
      transparent={true}
      visible={optionModalVisible}
      onRequestClose={() => setOptionModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={handleDeleteChat}>
            <Text style={styles.modalOption}>Delete Conversation</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setOptionModalVisible(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light background color
  },
  containerHeader: {
    backgroundColor: '#3F3D3C',
    padding: 10,
    height: 70,
},
containerSearch: {
  width: '100%',
  height: 50,
  backgroundColor: 'green',
  flexDirection: 'row',
  alignItems: 'center',
  paddingBottom: 5,
  paddingHorizontal: 10,
  marginBottom: 3,
},
searchInput: {
  width: '100%',
  height: 40,

},
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Light border color
    backgroundColor: '#E5F7E7', // Card background color
    borderRadius: 8, // Add some border radius for a card-like appearance
    margin: 1, // Add margin between chat items
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#DFDCDC', // Green color for avatar background
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
    borderColor: 'green',
    borderWidth: 1,
    margin: 8,
    paddingLeft: 8,
    width: '100%',
    color:'white',
  },
  searchResultItem: {
    padding: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalOption: {
    fontSize: 16,
    paddingVertical: 10,
    textAlign: 'center',
    color: 'red',
  },
  modalCancel: {
    fontSize: 16,
    paddingVertical: 10,
    textAlign: 'center',
    color: 'black', 
  },
});