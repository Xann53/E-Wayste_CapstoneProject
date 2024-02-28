import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db, auth, storage, firebase } from "../firebase_config";
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function ColManageList({ setViewAccFunction }) {
    const [lguCode, setLguCode] = useState();
    const [users, setUsers] = useState();

    const userRef = firebase.firestore().collection("users");

    useEffect(() => {
        const getUserData = async() => {
            const code = await AsyncStorage.getItem('userLguCode');
            setLguCode(code);
        }
        getUserData()
    }, []);

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setUsers(newData);

        };

        const unsubscribe = userRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }, []);

    function BodyContent() {
        try {
            users.sort((a, b) => {
                let fa = a.dateTime, fb = b.dateTime;
                if (fa < fb) {return -1;}
                if (fa > fb) {return 1;}
                return 0;
            })

            let temp = [];
            users.map((user) => {
                if(user.lguCode === lguCode && user.accountType === 'Garbage Collector') {
                    temp.push(
                        <TouchableOpacity activeOpacity={0.7} onPress={() => {setViewAccFunction(user.id)}} style={{display: 'flex', flex: 1, width: '100%', backgroundColor: 'white', marginBottom: 10, padding: 10, borderRadius: 10, shadowColor: 'black', shadowOpacity: 1, elevation: 1, flexDirection: 'row', alignItems: 'center'}}>
                            <View style={{display: 'flex', flex: 1, height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                                <View style={{padding: 10, paddingHorizontal: 11, backgroundColor: '#D3D3D3', borderRadius: 1000}}>
                                    <Ionicons name="person" style={{fontSize: 35, color: 'white'}} />
                                </View>
                            </View>
                            <View style={{display: 'flex', flex: 2.2, height: '100%', justifyContent: 'center', paddingHorizontal: 10, overflow: 'hidden'}}>
                                <Text style={{fontSize: 18, fontWeight: 800}}>{user.firstName} {user.lastName}</Text>
                                <Text numberOfLines={1} ellipsizeMode='tail'>{user.username}</Text>
                            </View>
                            {/* <View style={{display: 'flex', flex: 1, height: '100%', justifyContent: 'center', alignItems: 'flex-end'}}>
                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                    <TouchableOpacity onPress={() => {}}>
                                        <View style={{padding: 1, paddingHorizontal: 2, backgroundColor: '#E8A319', borderRadius: 5}}>
                                            <Ionicons name="menu" style={{fontSize: 25, color: 'white'}} />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View> */}
                        </TouchableOpacity>
                    );
                }
            });

            <ul>
                {temp.map(item =>
                    <li key='this is key :D'>{item}</li>
                )}
            </ul>

            return (
                <>
                    {temp}
                </>
            );
        } catch(e) {
            return (
                <></>
            );
        }
    }

    return (
        <>
            <BodyContent />
        </>
    );
}