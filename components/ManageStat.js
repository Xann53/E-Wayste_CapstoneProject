import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db, auth, storage, firebase } from "../firebase_config";
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

export default function ManagePageStat() {
    const [users, setUsers] = useState();
    const [pendingUser, setPendingUser] = useState();

    const [colNo, setColNo] = useState();
    const [pendingNo, setPendingNo] = useState();
    const [truckNo, setTruckNo] = useState();

    const usersRef = firebase.firestore().collection("users");
    const pendingUserRef = firebase.firestore().collection("pendingUsers");

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setUsers(newData);

        };

        const unsubscribe = usersRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }, [])

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

    function Content() {
        useEffect(() => {
            let ctr = 0;
            users.map((user) => {
                ctr++;
            });
            setColNo(ctr);
        }, []);

        return (
            <>
                <View style={{display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5}}>
                    <View style={{padding: 10, paddingHorizontal: 11, backgroundColor: 'orange', borderRadius: 1000}}>
                        <Ionicons name="man" style={{fontSize: 45}} />
                    </View>
                    <Text style={{fontWeight: 800}}>Collectors</Text>
                    <Text style={{fontWeight: 900, fontSize: 30}}>{colNo}</Text>
                </View>
                <View style={{display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5}}>
                    <View style={{padding: 10, paddingHorizontal: 11, backgroundColor: 'orange', borderRadius: 1000}}>
                        <Ionicons name="car" style={{fontSize: 45}} />
                    </View>
                    <Text style={{fontWeight: 800}}>Trucks</Text>
                    <Text style={{fontWeight: 900, fontSize: 30}}>80</Text>
                </View>
                <View style={{display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5}}>
                    <View style={{padding: 10, paddingHorizontal: 11, backgroundColor: 'orange', borderRadius: 1000}}>
                        <Ionicons name="car" style={{fontSize: 45}} />
                    </View>
                    <Text style={{fontWeight: 800}}>Pending</Text>
                    <Text style={{fontWeight: 900, fontSize: 30}}>80</Text>
                </View>
            </>
        );
    }

    return (
        <>
            <View style={{display: 'flex', width: '100%', height: 180, backgroundColor: 'white', borderRadius: 15, shadowColor: 'black', shadowOpacity: 1, elevation: 5, padding: 10, justifyContent: 'center', alignItems: 'center', overflow: 'hidden'}}>
                <View style={{display: 'flex', flex: 1, width: '100%', flexDirection: 'row', gap: 5}}>
                    <Content />
                </View>
            </View>
        </>
    );
}