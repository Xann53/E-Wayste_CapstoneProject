import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db, auth } from '../../../firebase_config';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function ViewMessage({ route, navigation }) {
  const [message, setMessage] = useState('');
  const [chatData, setChatData] = useState([]);
  const [receiverEmail, setReceiverEmail] = useState(route.params.receiverEmail || '');

  const authInstance = getAuth();
  const currentUser = authInstance.currentUser;

  const { chatId } = route.params;
  const messagesRef = collection(db, 'messages');

  const handleSend = async () => {
    if (message.trim() !== '') {
      await addDoc(messagesRef, {
        chatId,
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        receiverEmail,
        text: message,
        timestamp: serverTimestamp(),
      });
      setMessage('');
    }
  };
  console.log('chatId:', chatId);

  const formatTimestamp = (timestamp) => {
    return timestamp ? new Date(timestamp.seconds * 1000).toLocaleString() : '';
  };

  const renderItem = ({ item }) => {
    const isUserSender = item.senderId === currentUser.uid;
    return (
      <View
        style={[
          styles.messageContainer,
          isUserSender ? styles.userMessageContainer : styles.sellerMessageContainer,
        ]}
      >
        <Text style={styles.emailText}>
          {isUserSender ? 'me (' + currentUser.email + ')' : item.senderEmail}
        </Text>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={{ width: 200, height: 200 }} />
        ) : (
          <Text style={styles.messageText}>{item.text}</Text>
        )}
        <Text style={styles.timestampText}>{formatTimestamp(item.timestamp)}</Text>
      </View>
    );
  };

  useEffect(() => {
    if (chatId) {
      const q = query(
        messagesRef,
        where('chatId', '==', chatId),
        orderBy('timestamp', 'desc')
      );
  
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages = [];
        querySnapshot.forEach((doc) => {
          messages.push({ ...doc.data(), id: doc.id });
        });
        setChatData(messages);
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
            }
          })
          .catch((error) => {
            console.error('Error fetching chat details: ', error);
          });
      }
  
      return () => {
        unsubscribe();
      };
    }
  }, [chatId, receiverEmail]);

  return (
    
    <View style={styles.container}>
      
      <View style={styles.containerHeader}>
        <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 25 }}>
            <TouchableOpacity activeOpacity={0.5} onPress={() => { navigation.navigate('message') }}>
            <Ionicons name='arrow-back' style={{ fontSize: 35, color: '#BDE47C', top: 2 }} />
            </TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', top: 1, marginRight: 18 }}>Chats</Text>
            <Text style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', top: 1 }}> yes</Text>
        </View>
        </View>
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
      <TouchableOpacity onPress={() => handleCameraPress()}>
        <Ionicons name="camera-outline" size={24} color="green" />
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
    marginVertical: 5,
    flex:1,
   
  },
  composerContainer: {
    marginRight: 5,
    alignItems: 'center',
    flexDirection: 'row',
},
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50', // Green color for user messages
  },
  sellerMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#2196F3', // Blue color for seller messages
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
