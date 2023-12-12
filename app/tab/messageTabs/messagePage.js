import React, { useState, useEffect } from 'react';
import { db, auth,  firebase } from '../../../firebase_config';
import { useIsFocused } from '@react-navigation/native';
import SideNav from '../../../components/SideNav';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, Image, ScrollView } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, getDocs, limit, addDoc, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';
import { writeBatch } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function Message({navigation}) {
  const isFocused = useIsFocused();
  const [openSideBar, setOpenSideBar] = React.useState();
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

const refreshPageAndClearForms = () => {
  setSearchQuery('');
  setSearchResults([]);
  setSelectedChat(null);
  setUserRating('');
  setUserMessage('');

  // Set the refreshPage state to trigger a refresh
  setRefreshPage((prev) => !prev);
};
const toggleSideBar = () => {
  setOpenSideBar(!openSideBar);
};
useEffect(() => {
  if(!isFocused) {
      setOpenSideBar();
  }
});

useEffect(() => {
  if(!isFocused) {
      setOpenSideBar();
  }
});

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

function SideNavigation(navigation) {
  return (
      <>
          <View style={{position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99}}>
              <TouchableOpacity style={{ position: 'absolute', left: 20, top: 30, zIndex: 150 }} onPress={() => {setOpenSideBar()}}>
                  <Ionicons name='arrow-back' style={{ fontSize: 40, color: 'rgb(81,175,91)' }} />
              </TouchableOpacity>
              {SideBar(navigation)}
              <TouchableOpacity style={{position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0)', zIndex: -1}} onPress={() => {setOpenSideBar()}} />
          </View>
      </>
  );
}

useEffect(() => {
  if (currentUser) {
    const chatsRef = collection(db, 'chats');
    const unsubscribeChats = onSnapshot(chatsRef, async (querySnapshot) => {
      const allChats = [];

      for (const doc of querySnapshot.docs) {
        const userData = doc.data();

        if (userData && userData.users && userData.users.includes(currentUser.email)) {
          const messagesRef = collection(db, 'messages');
          const q = query(messagesRef, where('chatId', '==', doc.id), orderBy('timestamp', 'desc'), limit(1));
          const messagesSnapshot = await getDocs(q);

          if (!messagesSnapshot.empty) {
            const lastMessageData = messagesSnapshot.docs[0]?.data();
            const lastMessageTimestamp = lastMessageData?.timestamp?.toDate(); // Convert timestamp to Date

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

      allChats.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Compare timestamps as numbers
      setChatSummaries(allChats);
    });

    return () => unsubscribeChats();
  }
}, [currentUser, refreshPage]);


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
            <TouchableOpacity activeOpacity={0.5} onPress={() => { setOpenSideBar(true) }}>
              <Ionicons name='menu' style={{ fontSize: 40, color: '#ffffff', top: 2 }} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: 600, color: '#ffffff', top: 1 }}>Message</Text>
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
          source={require('../../../assets/NatureVector.jpg')}
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
      {openSideBar && (
        <View style={{ position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99 }}>
          <TouchableOpacity style={{ position: 'absolute', left: 20, top: 30, zIndex: 150 }} onPress={() => { setOpenSideBar(SideNavigation(navigation) )}}>
            <Ionicons name='arrow-back' style={{ fontSize: 40, color: 'rgb(81,175,91)' }} />
          </TouchableOpacity>
          <SideNav navigation={navigation} />
          <TouchableOpacity style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0)', zIndex: -1 }} onPress={() => { setOpenSideBar(false) }} />
        </View>
      )}
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
});