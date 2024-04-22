import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase_config';
import SideBar from '../../components/SideNav';
export default function NewMessage({ navigation }) {
    const [refreshing, setRefreshing] = React.useState(false);
    const [openSideBar, setOpenSideBar] = React.useState();
    const [searchText, setSearchText] = useState('');
    const [users, setUsers] = useState([]);
    const [refreshPage, setRefreshPage] = useState(false);
  
    const isFocused = useIsFocused();
    useEffect(() => {
      if (!isFocused) {
        setOpenSideBar();
      }
    }, [isFocused]);
  
    useEffect(() => {
        // Fetch users from Firebase and filter based on user type (collector or lgu)
        const fetchUsers = async () => {
          const usersCollection = collection(db, 'users');
          const usersSnapshot = await getDocs(query(usersCollection));
          const usersData = usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
      
          const currentUserUid = auth.currentUser?.uid;
      
          const filteredUsers = usersData
            .filter((user) => user.accountType === 'Garbage Collector' || user.accountType === 'LGU / Waste Management Head')
            .filter((user) => user.id !== currentUserUid);
      
          setUsers(filteredUsers);
        };
      
        fetchUsers();
      }, []);

  
    const onRefresh = React.useCallback(() => {
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }, []);
  
    function SideNavigation(navigation) {
      return (
        <>
          <View style={{ position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99 }}>
            <TouchableOpacity style={{ position: 'absolute', left: 20, top: 30, zIndex: 150 }} onPress={() => { setOpenSideBar(); }}>
              <Ionicons name='arrow-back' style={{ fontSize: 40, color: 'rgb(81,175,91)' }} />
            </TouchableOpacity>
            {SideBar(navigation)}
            <TouchableOpacity style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0)', zIndex: -1 }} onPress={() => { setOpenSideBar(); }} />
          </View>
        </>
      );
    }
  
    function BodyContent() {
      const currentUserUid = auth.currentUser?.uid;
      return (
        <View style={{ width: '100%', top: 55, marginBottom: 60 }}>

          {users.map((user) => (
            user.id !== currentUserUid && (
            <TouchableOpacity key={user.id} activeOpacity={0.5} onPress={() => navigateToChat(user.id, user.username)}>
              <View style={[styles.contentButton]}>
                <View style={styles.contentButtonFront}>
                  <View style={{ width: '95%', flexDirection: 'row', gap: 10, alignItems: 'flex-start',marginVertical: 12 }}>

                    <View style={styles.containerPfp}>
                      <Ionicons name='person-outline' style={styles.placeholderPfp} />
                    </View>
                    <View style={{ gap: 5, marginTop: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: 500, color: 'black' }}>{user.username}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            )
          ))}
        </View>
      );
    }
  
    const navigateToChat = (userId, username) => {
      navigation.navigate('chatView', { userId, username });
    };
  
    return (
      <>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <SafeAreaView style={styles.container}>
            {BodyContent()}
          </SafeAreaView>
        </ScrollView>
        <View style={styles.containerHeader}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 25 }}>
              <TouchableOpacity activeOpacity={0.5} onPress={() => { navigation.navigate('message'); }}>
                <Ionicons name='arrow-back' style={{ fontSize: 35, color: '#BDE47C', top: 2 }} />
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight:'bold', color: 'green', marginLeft: 50, top: 1 }}>New Message</Text>
            </View>
          </View>
        </View>
        <View style={styles.containerSearch}>
          <TouchableOpacity activeOpacity={0.5}>
            <Text style={{ fontSize: 16, color: '#ffffff', marginRight: 10 }}>To:</Text>
          </TouchableOpacity>
          <TextInput style={styles.searchInput} placeholderTextColor="#2596be" value={searchText} onChangeText={(text) => setSearchText(text)} />
        </View>
        <View style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -99 }}>
          <Image
            source={require('../../assets/green.jpg')}
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
      backgroundColor: 'white',
      justifyContent: 'flex-end',
      paddingBottom: 5,
      paddingHorizontal: 10,
    },
    contentButton: {
      width: '100%',
      borderBottomWidth: 1,
      borderColor: 'gray',
      overflow: 'hidden',
    },
    contentButtonFront: {
      width: '100%',
      backgroundColor: '#E1FADC',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'rgba(113, 112, 108, 1)',
    },
    containerPfp: {
      width: 35,
      height: 35,
      backgroundColor: 'rgba(255, 255, 255, 1)',
      borderRadius: 55,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderPfp: {
      fontSize: 20,
      color: 'rgba(113, 112, 108, 1)',
    },
    containerSearch: {
      position: 'absolute',
      width: '100%',
      height: 40,
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
    }
  });