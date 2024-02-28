import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db, auth, storage, firebase } from "../firebase_config";
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { set } from "react-native-reanimated";

export default function ManagePageStat({ navData, NavFunction, setColNoFunction, setPendingNoFunction, setTruckNoFunction }) {
    const [lguCode, setLguCode] = useState();

    const [users, setUsers] = useState();
    const [pendingUser, setPendingUser] = useState();
    const [trucks, setTrucks] = useState();

    const [colNo, setColNo] = useState(0);
    const [pendingNo, setPendingNo] = useState(0);
    const [truckNo, setTruckNo] = useState(0);

    const usersRef = firebase.firestore().collection("users");
    const pendingUserRef = firebase.firestore().collection("pendingUsers");
    const trucksRef = firebase.firestore().collection("trucks");

    useEffect(() => {
        const getUserData = async() => {
            const code = await AsyncStorage.getItem('userLguCode');
            setLguCode(code);
        }
        getUserData()
    }, [])

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

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setTrucks(newData);

        };

        const unsubscribe = trucksRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }, []);

    function Content() {
        useEffect(() => {
            let ctr = 0;
            try {
                users.map((user) => {
                    if(user.accountType === 'Garbage Collector' && user.lguCode === lguCode) {
                        ctr++;
                    }
                });
            } catch(e) {}
            setColNo(ctr);
            setColNoFunction(ctr);
        }, []);

        useEffect(() => {
            let ctr = 0;
            try {
                trucks.map((truck) => {
                    if(truck.lguCode === lguCode) {
                        ctr++
                    }
                });
            } catch(e) {}
            setTruckNo(ctr);
            setTruckNoFunction(ctr);
        }, []);

        useEffect(() => {
            let ctr = 0;
            try {
                pendingUser.map((user) => {
                    if(user.accountType === 'Garbage Collector' && user.lguCode === lguCode) {
                        ctr++;
                    }
                });
            } catch(e) {}
            setPendingNo(ctr);
            setPendingNoFunction(ctr);
        }, []);

        return (
            <>
                <TouchableOpacity onPress={() => {NavFunction('Collectors')}} style={{display: 'flex', flex: navData === 'Collectors' ? 1.2 : 1, alignItems: 'center', justifyContent: 'center', gap: 3, borderWidth: navData === 'Collectors' ? 1 : 0.5}}>
                    <View style={{padding: 10, paddingHorizontal: 11, backgroundColor: 'orange', borderRadius: 1000}}>
                        <Ionicons name="man" style={{fontSize: 45, transform:[{translateX: 2}]}} />
                    </View>
                    <Text style={{fontWeight: 800}}>Collectors</Text>
                    <Text style={{fontWeight: 900, fontSize: 30}}>{colNo}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {NavFunction('Trucks')}} style={{display: 'flex', flex: navData === 'Trucks' ? 1.2 : 1, alignItems: 'center', justifyContent: 'center', gap: 3, borderWidth: navData === 'Trucks' ? 1 : 0.5}}>
                    <View style={{padding: 10, paddingHorizontal: 11, backgroundColor: 'orange', borderRadius: 1000}}>
                        <Ionicons name="bus" style={{fontSize: 45, transform:[{translateX: 0.5}]}} />
                    </View>
                    <Text style={{fontWeight: 800}}>Trucks</Text>
                    <Text style={{fontWeight: 900, fontSize: 30}}>{truckNo}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {NavFunction('Pending')}} style={{display: 'flex', flex: navData === 'Pending' ? 1.2 : 1, alignItems: 'center', justifyContent: 'center', gap: 3, borderWidth: navData === 'Pending' ? 1 : 0.5}}>
                    <View style={{padding: 10, paddingHorizontal: 11, backgroundColor: 'orange', borderRadius: 1000}}>
                        <Ionicons name="file-tray-full" style={{fontSize: 45, transform:[{translateX: 0.5}]}} />
                    </View>
                    <Text style={{fontWeight: 800}}>Pending</Text>
                    <Text style={{fontWeight: 900, fontSize: 30}}>{pendingNo}</Text>
                </TouchableOpacity>
            </>
        );
    }

    return (
        <>
            <View style={{display: 'flex', width: '100%', height: 210, backgroundColor: 'white', borderRadius: 15, shadowColor: 'black', shadowOpacity: 1, elevation: 5, padding: 10, justifyContent: 'center', alignItems: 'center', overflow: 'hidden'}}>
                <Text style={{fontSize: 20, fontWeight: 900, marginBottom: 5}}>STATISTICS</Text>
                <View style={{display: 'flex', flex: 1, width: '100%', flexDirection: 'row', gap: 5}}>
                    <Content />
                </View>
            </View>
        </>
    );
}