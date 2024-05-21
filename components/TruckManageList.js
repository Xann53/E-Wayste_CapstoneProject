import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db, auth, storage, firebase } from "../firebase_config";
import { collection, addDoc, getDocs, query, updateDoc, doc, deleteDoc } from 'firebase/firestore';

export default function TrkManageList({ setViewTruckFunction }) {
    const [lguCode, setLguCode] = useState();
    const [users, setUsers] = useState();
    const [trucks, setTrucks] = useState();
    const [allShift, setAllShift] = useState([]);
    const [allActiveTask, setAllActiveTask] = useState([]);

    const userRef = firebase.firestore().collection("users");
    const trucksRef = firebase.firestore().collection("trucks");
    const sihftRef = firebase.firestore().collection("collectorShift");
    const activeRef = firebase.firestore().collection("activeTask");

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

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllShift(newData);
        };
        const unsubscribe = sihftRef.onSnapshot(onSnapshot);
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
            setAllActiveTask(newData);
        };
        const unsubscribe = activeRef.onSnapshot(onSnapshot);
        return () => {
            unsubscribe();
        };
    }, [])

    async function ChangeCondition(id, condition) {
        const collectDoc = doc(db, 'trucks', id);
        await updateDoc(collectDoc, {
            condition: condition
        });
    }

    function BodyContent() {
        try {
            trucks.sort((a, b) => {
                let fa = a.dateTime, fb = b.dateTime;
                if (fa < fb) {return -1;}
                if (fa > fb) {return 1;}
                return 0;
            })

            let temp = [];
            let ctr = 1;
            trucks.map((truck) => {
                let isActive = false;
                allActiveTask.map((task) => {
                    allShift.map((shift) => {
                        if(task.shiftId === shift.id) {
                            if(shift.truckId === truck.id) {
                                isActive = true;
                            }
                        }
                    })
                })
                if(truck.lguCode === lguCode) {
                    temp.push(
                        <TouchableOpacity activeOpacity={0.7} onPress={() => {setViewTruckFunction(truck.id)}} style={{display: 'flex', flex: 1, width: '100%', backgroundColor: 'white', marginBottom: 10, padding: 10, borderRadius: 10, shadowColor: 'black', shadowOpacity: 1, elevation: 1, flexDirection: 'row', alignItems: 'center'}}>
                            <View style={{display: 'flex', flex: 1, height: '100%', justifyContent: 'center', alignItems: 'center', paddingRight: 5}}>
                                <View style={{padding: 10, paddingHorizontal: 11, backgroundColor: '#D3D3D3', borderRadius: 1000}}>
                                    <Ionicons name="bus" style={{fontSize: 35, color: 'white'}} />
                                </View>
                            </View>
                            <View style={{display: 'flex', flex: 2.2, height: '100%', justifyContent: 'center', paddingHorizontal: 10, overflow: 'hidden'}}>
                                <Text style={{fontSize: 18, fontWeight: 800, color: 'green'}}>TRUCK NO. {ctr}</Text>
                                <Text numberOfLines={1} ellipsizeMode='tail' style={{fontWeight: 700, fontSize: 15}}>{truck.plateNo}</Text>
                                <Text style={{marginTop: 10}}><Text style={{fontWeight: 700}}>Driver:</Text> 
                                    {users.map((user) => {
                                        if(user.id === truck.driverID) {
                                            return (' ' + user.firstName + ' ' + user.lastName);
                                        }
                                    })}
                                </Text>
                                <Text numberOfLines={2} ellipsizeMode='tail' style={{marginBottom: 5}}><Text style={{fontWeight: 700}}>Collectors:</Text>  {truck.members.collector.map(col => (<Text key={col.id}>
                                    {users.map((user) => {
                                        if(user.id === col.id) {
                                            return (user.firstName + ' ' + user.lastName);
                                        }
                                    })}
                                , </Text>))}</Text>
                                {truck.condition === 'inoperational' ?
                                    <Text>
                                        <Text style={{fontWeight: 700}}>Status:</Text> <Text style={{fontWeight: 900, color: /*'#DE462A'*/ 'red'}}>INOPERATIONAL</Text>
                                    </Text>
                                    :
                                    <Text>
                                        <Text style={{fontWeight: 700}}>Status:</Text> <Text style={{fontWeight: 900, color: isActive ? 'green' : 'orange'}}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
                                    </Text>
                                }
                            </View>
                            <View style={{display:'flex', flex: 0.4, height: '100%', alignItems: 'flex-end'}}>
                                <TouchableOpacity onPress={() => {ChangeCondition(truck.id, (truck.condition === 'inoperational' ? 'operational' : 'inoperational'))}} style={{backgroundColor: truck.condition === 'inoperational' ? 'rgb(126,185,73)' : 'rgb(179,229,94)', padding: 4, borderRadius: 100}}>
                                    <Ionicons name={truck.condition === 'inoperational' ? 'checkmark' : 'hammer'} size={18} color={'white'} />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    );
                    ctr++;
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