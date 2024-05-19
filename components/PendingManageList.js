import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";

import { db, auth, storage, firebase } from "../firebase_config";
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export default function PndManageList({ setViewAccFunction }) {
    const userRef = firebase.firestore().collection("users");

    const [lguCode, setLguCode] = useState('');
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        const getUserData = async() => {
            const code = await AsyncStorage.getItem('userLguCode');
            setLguCode(code);
        }
        getUserData()
    })

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllUsers(newData);
        };
        const unsubscribe = userRef.onSnapshot(onSnapshot);
        return () => {
            unsubscribe();
        };
    }, [])

    const deleteCol = async(id) => {
        const docRef = doc(db, 'users', id);
        await deleteDoc(docRef);
    }

    function BodyContent() {
        allUsers.sort((a, b) => {
            if(a.dateTime < b.dateTime) {return -1;}
            if(a.dateTime > b.dateTime) {return 1;}
        });

        let temp = [];
        allUsers.map((user, index) => {
            if(user.accountType === 'Pending' && user.lguCode === lguCode) {
                temp.push(
                    <TouchableOpacity key={index} activeOpacity={0.7} onPress={() => {setViewAccFunction(user.id)}} style={{display: 'flex', flex: 1, width: '100%', backgroundColor: 'white', marginBottom: 10, padding: 10, borderRadius: 10, shadowColor: 'black', shadowOpacity: 1, elevation: 1, flexDirection: 'row', alignItems: 'center'}}>
                        <View style={{display: 'flex', flex: 0.9, height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                            <View style={{padding: 10, paddingHorizontal: 11, backgroundColor: '#D3D3D3', borderRadius: 1000}}>
                                <Ionicons name="person" style={{fontSize: 35, color: 'white'}} />
                            </View>
                        </View>
                        <View style={{display: 'flex', flex: 2.2, height: '100%', justifyContent: 'center', paddingHorizontal: 10, overflow: 'hidden'}}>
                            <Text style={{fontSize: 14, fontWeight: 800}}>{user.username}</Text>
                            <Text numberOfLines={1} ellipsizeMode='tail' style={{fontSize: 13}}>Password: {user.password}</Text>
                        </View>
                        <View style={{display: 'flex', flex: 0.45, height: '100%', justifyContent: 'center', alignItems: 'flex-end'}}>
                            <View style={{display: 'flex', flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                <TouchableOpacity onPress={() => {deleteCol(user.id)}}>
                                    <View style={{padding: 1, paddingHorizontal: 2, backgroundColor: '#E8A319', borderRadius: 5}}>
                                        <Ionicons name="trash-outline" style={{fontSize: 25, color: 'white'}} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            }
        });

        return (
            <>
                {temp}
            </>
        );
    }

    return (
        <>
            <BodyContent />
        </>
    );
}