import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Modal } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, addDoc, getDocs, serverTimestamp, writeBatch, getDoc, doc, deleteDoc,updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db, auth, storage } from '../../firebase_config';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';


export default function ViewMessage({ route, navigation }) {
  const [message, setMessage] = useState('');
  const [chatData, setChatData] = useState([]);
  const [receiverEmail, setReceiverEmail] = useState(route.params.receiverEmail || '');
  const [receiverUsername, setReceiverUsername] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshPage, setRefreshPage] = useState(false);


  const authInstance = getAuth();
  const currentUser = authInstance.currentUser;
  const { chatId } = route.params;
  const messagesRef = collection(db, 'messages');

  // const handleSend = async () => {
  //   if (message.trim() !== '') {
  //     await addDoc(messagesRef, {
  //       chatId,
  //       senderId: currentUser.uid,
  //       senderEmail: currentUser.email,
  //       text: message,
  //       timestamp: serverTimestamp(),
        
  //     });
  
  //     setMessage('');
  //     setRefreshPage((prev) => !prev);
  //   }
  // };
  const handleSend = async () => {
    if (message.trim() !== '') {
      try {
        const messagesRef = collection(db, 'messages');
        const chatRef = doc(db, 'chats', chatId);
  
        // Add the new message to the messages collection
        await addDoc(messagesRef, {
          chatId,
          senderId: currentUser.uid,
          senderEmail: currentUser.email,
          text: message,
          timestamp: serverTimestamp(),
        });
  
        // Fetch the current unread count
        const chatSnap = await getDoc(chatRef);
  
        if (chatSnap.exists()) {
          const currentUnreadCount = chatSnap.data().unreadCount || 0;
  
          // Increment the unread count for the recipient and set lastMessageSenderId
          await updateDoc(chatRef, {
            unreadCount: currentUnreadCount + 1,
            lastMessageSenderId: currentUser.uid,
            lastMessage: message, // store the last message text if needed
          });
        }
  
        // Clear the input field and trigger refresh
        setMessage('');
        setRefreshPage((prev) => !prev);
      } catch (error) {
        console.error('Error sending message: ', error);
      }
    }
  };
  
  
  
  
  const toggleDeleteModal = () => {
    setDeleteModalVisible(!isDeleteModalVisible);
  };  

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
  
    const date = new Date(timestamp.seconds * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  

  const renderItem = ({ item }) => {
    const isUserSender = item.senderId === currentUser.uid;

    return (
      <View
        style={[
          styles.messageContainer,
          isUserSender ? styles.userMessageContainer : styles.ReceiverMessageContainer,
        ]}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={{ width: 200, height: 200 }} />
        ) : item.capturedImage ? (
          <Image source={{ uri: item.capturedImage }} style={{ width: 200, height: 200 }} />
        ) : (
          <Text style={styles.messageText}>{item.text}</Text>
        )}
        <Text style={styles.timestampText}>{formatTimestamp(item.timestamp)}</Text>
      </View>
    );
  };

  const fetchChatDetails = async () => {
    if (chatId) { 
      try {
        const chatDetailsRef = doc(db, 'chats', chatId);
        const docSnap = await getDoc(chatDetailsRef);
  
        if (docSnap.exists()) {
          const chatDetails = docSnap.data();
          const otherParticipantEmail = chatDetails.users.find(
            (email) => email !== currentUser.email
          );
  
          setReceiverEmail(otherParticipantEmail);
  
          const userRef = collection(db, 'users');
          const userQuery = query(userRef, where('email', '==', otherParticipantEmail));
          const userDocs = await getDocs(userQuery);
  
          userDocs.forEach((doc) => {
            const userData = doc.data();
            const receiverFirstName = userData.firstName;
            const receiverLastName = userData.lastName;
            const fullName = receiverFirstName + ' ' + receiverLastName;
            setReceiverUsername(fullName);
          });
          
  
          if (userDocs.empty) {
            console.log('No user document found for email:', otherParticipantEmail);
          }
        }
      } catch (error) {
        console.error('Error fetching receiver user data: ', error);
      }
    }
  };
  

useEffect(() => {
  if (chatId) {
    fetchChatDetails(); 
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = new Set(); // Use a Set to store unique messages
      querySnapshot.forEach((doc) => {
        messages.add({ ...doc.data(), id: doc.id }); // Add messages to the Set
      });
      setChatData(Array.from(messages)); // Convert the Set back to an array
    });
    if (!receiverEmail) {
      const chatDetailsRef = doc(db, 'chats', chatId);
      getDoc(chatDetailsRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const chatDetails = docSnap.data();
            const otherParticipantEmail = chatDetails.users.find(
              (email) => email !== currentUser.email
            );
            setReceiverEmail(otherParticipantEmail);
            const userRef = collection(db, 'users');
            const userQuery = query(userRef, where('email', '==', otherParticipantEmail));
            return getDoc(userQuery);  // Return the promise here
          }
        })
        .then((userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const receiverUsername = userData.username;
            setReceiverUsername(receiverUsername);
          } else {
            console.log('User document does not exist for email:', otherParticipantEmail);
          }
        })
        .catch((error) => {
          console.error('Error fetching receiver user data: ', error);
        });
    }
    return () => {
      unsubscribe();
    };
  }
}, [chatId, receiverEmail]);

const handleImagePress = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0];
      console.log('Image URI:', selectedImage.uri);
      if (chatId) {
        await addDoc(messagesRef, {
          chatId,
          senderId: currentUser.uid,
          senderEmail: currentUser.email,
          imageUrl: selectedImage.uri,
          timestamp: serverTimestamp(),
        });
      }
    } else {
      console.log('Image picker was cancelled');
    }
  } catch (error) {
    console.error('Error picking image:', error);
  }
};


  return (
    <View style={styles.container}>
      <View style={styles.containerHeader}>
        <View style={{ direction: 'flex', flexDirection: 'row' }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', top: 10 }}>
            <TouchableOpacity activeOpacity={0.5} onPress={() => { navigation.navigate('message') }}>
              <Ionicons name='arrow-back' style={{ fontSize: 35, color: '#BDE47C', top: 2 }} />
            </TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', top: 1, marginRight: 40 }}>Chats</Text>
            <Text style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', top: 1 }}>{receiverUsername}</Text>
          </View>
        </View>
      </View>
      <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgb(75,163,84)', zIndex: -99 }}>
        <Image
          source={require('../../assets/NatureVector.jpg')}
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
      <FlatList
        data={chatData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        inverted={true}
      />
      <View style={styles.inputContainer}>
        <View style={styles.composerContainer}>
          <TouchableOpacity onPress={() => handleImagePress()}>
            <Ionicons name="image-outline" size={24} color="green" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.textInput}
          placeholder="Type your message..."
          value={message}
          onChangeText={(text) => setMessage(text)}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 50,
    paddingBottom: 10,
    width: '100%',
    height: '100%',
  },
  containerHeader: {
    backgroundColor: '#3F3D3C',
    padding: 10,
},
  messageContainer: {
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
    flex:1,
  },
  composerContainer: {
    marginRight: 5,
    alignItems: 'center',
    flexDirection: 'row',
},
  userMessageContainer: {
    alignSelf: 'flex-end',
    borderRadius: 15,
    backgroundColor: '#87FF74', // Green color for user messages
  },
  ReceiverMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF', // Blue color for seller messages
    borderRadius: 15,
  },
  emailText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  timestampText: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    padding: 7,
    backgroundColor: '#3F3D3C',
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#87FF74',
    paddingHorizontal: 10,
    marginRight: 10,
    height: 40,
    backgroundColor: 'white',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
