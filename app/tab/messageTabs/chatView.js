import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';
import { FlatList } from 'react-native';

import SideBar from '../../../components/SideNav';

export default function ViewMessage({navigation}) {
    const [refreshing, setRefreshing] = React.useState(false);
    const [openSideBar, setOpenSideBar] = React.useState();
    const [searchText, setSearchText] = useState('');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const sendMessage = () => {
        if (newMessage.trim() !== '') {
            setMessages([...messages, { id: messages.length, text: newMessage }]);
            setNewMessage('');
        }
    };
   

    const isFocused = useIsFocused();
    useEffect(() => {
        if(!isFocused) {
            setOpenSideBar();
        }
    });
    
    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

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

    function BodyContent() {
        return (
            <View style={styles.containerMessage}>
                <FlatList
                    style={styles.messages}
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.messageBubble}>
                            <Text>{item.text}</Text>
                        </View>
                    )}
                />
                
                <View style={styles.userInput}>
                    <View><Text>FOR ICONS</Text></View>
                    <TextInput
                        style={styles.messageInput}
                        placeholder="Type your message..."
                        placeholderTextColor="white"
                        value={newMessage}
                        onChangeText={(text) => setNewMessage(text)}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
    return (
        <>

                <SafeAreaView style={styles.container}>
                    {BodyContent()}
                </SafeAreaView>
      
            <View style={styles.containerHeader}>
                <View style={{ flexDirection: 'row'}}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 25 }}>
                        <TouchableOpacity activeOpacity={0.5} onPress={() => {navigation.navigate('message')}}>
                            <Ionicons name='arrow-back' style={{fontSize: 35, color: '#BDE47C', top: 2}} />
                        </TouchableOpacity>
                        <Text style={{fontSize: 18 , fontWeight: 600, color: '#ffffff',top: 1, marginRight: 18}}>Chats</Text>
                        <Text style={{fontSize: 14, fontWeight: 600, color: '#ffffff',top: 1}}> Anne Curtis</Text>
                    </View>
                </View>
            </View>
            <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgb(75,163,84)', zIndex: -99}}>
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
            {openSideBar}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 50,
        paddingBottom: 10,
        marginTop: 55,
    },
    containerHeader: {
        position: 'absolute',
        width: '100%',
        height: 75,
        backgroundColor: '#3F3D3C',
        justifyContent: 'flex-end',
        paddingBottom: 5,
        paddingHorizontal: 10,
    },
    contentButton: {
        width: '100%',
        borderBottomWidth: 1,
        borderColor: 'rgb(13, 86, 1)',
        overflow: 'hidden',
        
    },
    contentButtonFront: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'rgba(113, 112, 108, 1)',
    },
    containerPfp: {
        width: 45,
        height: 45,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 55,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderPfp: {
        fontSize: 25,
        color: 'rgba(113, 112, 108, 1)',
    },

    // CHAT SCREEN
    containerSearch: {
        position: 'absolute',
        width: '100%',
        height: 50,
        backgroundColor: 'green',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 5,
        paddingHorizontal: 10,
        marginTop: 75,
      },
      searchInput: {
        flex: 1,
        color: '#ffffff',
      },
      containerMessage: {
        flex: 1,
        backgroundColor: 'transparent',
        width: '100%',
        overflow: 'hidden',

      },
      header: {
        backgroundColor: '#4CAF50',
        padding: 10,
        alignItems: 'center',
      },
      
      messages: {
        flex: 1,
        padding: 20,

      },
      messageBubble: {
        backgroundColor: 'white',
        padding: 10,
        marginVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ccc',
      },
      userInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#ccc',
        padding: 7,
        backgroundColor: '#3F3D3C',
      },
      messageInput: {
        flex: 1,
        padding: 5,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        marginRight: 10,
        color: 'white',
        
      },
      sendButton: {
        backgroundColor: '#4CAF50',
        padding: 7,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
      },
      sendButtonText: {
        color: 'white',
      },
})