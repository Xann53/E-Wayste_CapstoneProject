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
    const [lguCode, setLguCode] = useState();
    const [pendingUser, setPendingUser] = useState();

    const usersRef = collection(db, "users");
    const pendingUserRef = firebase.firestore().collection("pendingUsers");

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

            setPendingUser(newData);

        };

        const unsubscribe = pendingUserRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }, []);
    
    function BodyContent() {
        const confirmPendingUser = async(id) => {
            let accountType, associatedImage, firstName, lastName, username, email, province, municipality, barangay, contactNo, lguCode, password;
            pendingUser.map((user) => {
                if(user.id === id) {
                    accountType = user.accountType;
                    associatedImage = user.associatedImage;
                    firstName = user.firstName;
                    lastName = user.lastName;
                    username = user.username;
                    email = user.email;
                    province = user.province;
                    municipality = user.municipality;
                    barangay = user.barangay;
                    contactNo = user.contactNo;
                    lguCode = user.lguCode;
                    password = user.password; 
                }
            });
            const dateMade = moment().utcOffset('+08:00').format('YYYY/MM/DD');
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                await addDoc(usersRef, {
                    accountType: accountType,
                    associatedImage: associatedImage,
                    firstName: firstName,
                    lastName: lastName,
                    username: username,
                    email: email,
                    province: province,
                    municipality: municipality,
                    barangay: barangay,
                    contactNo: contactNo,
                    lguCode: lguCode,
                    password: password,
                    dateMade: dateMade
                }); 
                deletePendingUser(id);
            } catch(error) {
                alert(error.message);
            }
        }

        const deletePendingUser = async(id, deleteImg) => {
            const docRef = doc(db, 'pendingUsers', id);
            await deleteDoc(docRef);
            if(deleteImg !== undefined) {
                // console.log('Delete Image');
            }
        }

        try {
            pendingUser.sort((a, b) => {
                let fa = a.dateTime, fb = b.dateTime;
                if (fa < fb) {return -1;}
                if (fa > fb) {return 1;}
                return 0;
            })

            let temp = [];
            pendingUser.map((user) => {
                if(user.lguCode === lguCode) {
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
                            <View style={{display: 'flex', flex: 1, height: '100%', justifyContent: 'center', alignItems: 'flex-end'}}>
                                <View style={{display: 'flex', flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                    <TouchableOpacity onPress={() => {confirmPendingUser(user.id)}}>
                                        <View style={{padding: 1, paddingHorizontal: 2, backgroundColor: 'rgba(126, 185, 73, 1)', borderRadius: 5}}>
                                            <Ionicons name="checkmark" style={{fontSize: 25, color: 'white'}} />
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => {deletePendingUser(user.id, user.associatedImage)}}>
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