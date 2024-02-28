import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard, ScrollView, SafeAreaView, Button, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from '@react-navigation/native';
import moment from "moment";
import { SelectList } from "react-native-dropdown-select-list";

import { db, auth, storage, firebase } from "../firebase_config";
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { log } from "react-native-reanimated";

export default function EditTruck({ close, truckID, driverFName }) {
    const [lguCode, setLguCode] = useState();
    const [users, setUsers] = useState([]);
    const [trucks, setTrucks] = useState([]);

    const DriverChoice = [];
    const CollectorChoice = [];

    const [inputFocus, setInputFocus] = useState(false);
    const [members, setMembers] = useState({ collector: [] });
    const [plateNo, setPlateNo] = useState('');
    const [driverID, setDriverID] = useState('');
    const [colID, setColID] = useState('');
    const [drvrPlaceHolder, setDrvrPlaceHolder] = useState();

    const truckColRef = collection(db, 'trucks');
    const userRef = firebase.firestore().collection("users");
    const truckRef = firebase.firestore().collection("trucks");

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

            for(let i = 0; i < newData.length; i++) {
                if(newData[i].id === truckID) {
                    setPlateNo(newData[i].plateNo);
                    setDriverID(newData[i].driverID);
                    setMembers(newData[i].members);
                    setDrvrPlaceHolder(driverFName);
                }
            }

        };

        const unsubscribe = truckRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }, []);

    try {
        let ctr = 1;
        DriverChoice[0] = { key: '', value: '[Select Driver]' };
        for(let i = 0; i < users.length; i++) {
            if(users[i].accountType === 'Garbage Collector' && users[i].lguCode === lguCode) {
                let isRepeat = false;
                members.collector.map((col) => {
                    if(users[i].id === col.id) {
                        isRepeat = true;
                    }
                })
                if(!isRepeat) {
                    DriverChoice[ctr] = { key: users[i].id, value: (users[i].firstName + ' ' + users[i].lastName) };
                    ctr++;
                }
            }
        }
    } catch(e) {}

    try {
        let ctr = 1;
        CollectorChoice[0] = { key: '', value: '[Select Collector]' };
        for(let i = 0; i < users.length; i++) {
            if(users[i].accountType === 'Garbage Collector' && users[i].lguCode === lguCode && users[i].id !== driverID) {
                let isRepeat = false;
                members.collector.map((col) => {
                    if(users[i].id === col.id) {
                        isRepeat = true;
                    }
                })
                if(!isRepeat) {
                    CollectorChoice[ctr] = { key: users[i].id, value: (users[i].firstName + ' ' + users[i].lastName) };
                    ctr++;
                }
            }
        }
    } catch(e) {}

    const dismissKeyboard = async() => {
        Keyboard.dismiss();
    }

    const addCol = async() => {
        let isRepeat = false;
        members.collector.map((col) => {
            if(colID === col.id) {
                isRepeat = true;
            }
        })

        if(colID !== '') {
            if(!isRepeat) {
                setMembers((prev) => ({
                    ...prev,
                    collector: [...prev.collector, {id: colID}]
                }));
            } else if(isRepeat) {
                alert("Collector has already been entered.");
            }
        } else {
            alert("No Collector's Name Entered!");
        }
    }

    const delCol = async(id) => {
        setMembers({ collector: members.collector.filter((col) => col.id !== id) });
    }

    const updateTruck = async() => {
        if(plateNo !== '' && driverID !== '' && members.collector.length > 0) {
            const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD HH:mm:ss');
            const truckDoc = doc(db, 'trucks', truckID);
            await updateDoc(truckDoc, {
                driverID: driverID,
                members: members,
                dateTime: fullDateTime
            });
            clear();
            close();
        } else {
            alert('Incomplete Form!');
        }
    }

    const clear = async() => {
        setMembers({ collector: [] });
        setPlateNo('');
        setDriverID('');
        setColID('');
    }

    return (
        <>
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
                <View style={{position: 'absolute', display: 'flex', flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 5}}>
                    <Text style={{fontSize: 20, fontWeight: 900, color: 'green', marginTop: -100, zIndex: 25, transform:[{translateY: 38}]}}>EDIT TRUCK</Text>
                    <View style={{display: 'flex', backgroundColor: 'white', width: '80%', height: '65%', borderRadius: 10, zIndex: 5}}>
                        <View style={{width: '100%', alignItems: 'flex-end', paddingVertical: 10, paddingRight: 10}}>
                            <TouchableOpacity onPress={() => {clear(); close()}}>
                                <View style={{padding: 1, paddingHorizontal: 2, backgroundColor: '#D3D3D3', borderRadius: 5}}>
                                    <Ionicons name="close" style={{fontSize: 20, color: 'white'}} />
                                </View>
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{width: '100%', height: '100%'}}>
                            <TouchableOpacity activeOpacity={1} style={{display: 'flex', alignItems: 'center', padding: 10, gap: 5}}>
                                <TextInput
                                    value={plateNo}
                                    editable={false}
                                    textAlign="center"
                                    onFocus={() => {setInputFocus(true)}}
                                    onBlur={() => {setInputFocus(false)}}
                                    placeholder="PLATE NUMBER"
                                    style={{borderRadius: 5, fontSize: 22, fontWeight: '700', padding: 5, paddingHorizontal: 25, width: '100%', color: 'black'}}
                                />
                                <View style={{display: 'flex', width: '100%', padding: 10, gap: 15}}>
                                    <View style={{display: 'flex', width: '100%'}}>
                                        <Text style={{fontSize: 15, fontWeight: 600}}>Driver:</Text>
                                        <SelectList
                                            setSelected={(e) => {setDriverID(e)}}
                                            data={DriverChoice}
                                            placeholder={drvrPlaceHolder}
                                            boxStyles={{
                                                width: '100%',
                                                height: 40,
                                                backgroundColor: "rgb(189,228,124)",
                                                borderRadius: 5,
                                                borderWidth: 0,
                                                paddingLeft: 10,
                                                paddingVertical: 0,
                                                alignItems: 'center',
                                                paddingHorizontal: 15,
                                            }}
                                            dropdownStyles={{
                                                width: '100%',
                                                backgroundColor: "rgb(231,247,233)",
                                                marginTop: -10,
                                                marginBottom: -10,
                                                borderRadius: 0,
                                                zIndex: -1,
                                                borderWidth: 0,
                                                alignSelf: 'center',
                                            }}
                                            search={false}
                                        />
                                    </View>
                                    <View style={{display: 'flex', width: '100%'}}>
                                        <Text style={{fontSize: 15, fontWeight: 600}}>Collectors:</Text>
                                        <View style={{display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%', gap: 5}}>
                                            <View style={{display: 'flex', flex: 6}}>
                                                <SelectList
                                                    setSelected={(e) => {setColID(e)}}
                                                    data={CollectorChoice}
                                                    placeholder="[Select Collector]"
                                                    boxStyles={{
                                                        width: '100%',
                                                        height: 40,
                                                        backgroundColor: "rgb(189,228,124)",
                                                        borderRadius: 5,
                                                        borderWidth: 0,
                                                        paddingLeft: 10,
                                                        paddingVertical: 0,
                                                        alignItems: 'center',
                                                        paddingHorizontal: 15,
                                                    }}
                                                    dropdownStyles={{
                                                        width: '100%',
                                                        backgroundColor: "rgb(231,247,233)",
                                                        marginTop: -10,
                                                        // marginBottom: -10,
                                                        borderRadius: 0,
                                                        zIndex: -1,
                                                        borderWidth: 0,
                                                        alignSelf: 'center',
                                                    }}
                                                    search={false}
                                                />
                                            </View>
                                            <View style={{display: 'flex', flex: 1, alignItems: 'flex-end'}}>
                                                <TouchableOpacity onPress={() => {addCol(); setColID('');}} style={{width: '100%', alignItems: 'center', backgroundColor: 'orange', borderRadius: 5, shadowColor: 'black', shadowOpacity: 1, elevation: 5}}>
                                                    <Text style={{fontSize: 29, fontWeight: 700, color: 'white'}}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View style={{display: 'flex', flex: 1, width: '100%', marginTop: 10, gap: 5}}>
                                            {members.collector.map(col => (
                                                <View key={col.id} style={{display: 'flex', flex: 1, width: '100%', backgroundColor: 'white', padding: 10, borderRadius: 10, shadowColor: 'black', shadowOpacity: 1, elevation: 1, flexDirection: 'row', alignItems: 'center'}}>
                                                    <View style={{display: 'flex', flex: 1, height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                                                        <View style={{padding: 10, paddingHorizontal: 11, backgroundColor: '#D3D3D3', borderRadius: 1000}}>
                                                            <Ionicons name="person" style={{fontSize: 25, color: 'white'}} />
                                                        </View>
                                                    </View>
                                                    <View style={{display: 'flex', flex: 2.2, height: '100%', justifyContent: 'center', paddingHorizontal: 10, overflow: 'hidden'}}>
                                                        <Text numberOfLines={1} ellipsizeMode='tail' style={{fontSize: 15, fontWeight: 800}}>
                                                            {users.map((user) => {
                                                                if(user.id === col.id) {
                                                                    return (user.firstName + ' ' + user.lastName);
                                                                }
                                                            })}
                                                        </Text>
                                                        <Text numberOfLines={1} ellipsizeMode='tail'>
                                                            {users.map((user) => {
                                                                if(user.id === col.id) {
                                                                    return (user.username);
                                                                }
                                                            })}
                                                        </Text>
                                                    </View>
                                                    <View style={{display: 'flex', flex: 0.5, height: '100%', justifyContent: 'center', alignItems: 'center'}}>
                                                        <TouchableOpacity onPress={() => {delCol(col.id)}}>
                                                            <View style={{padding: 1, paddingHorizontal: 2, backgroundColor: 'orange', borderRadius: 5}}>
                                                                <Ionicons name="close" style={{fontSize: 15, color: 'white'}} />
                                                            </View>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    </View> 
                                </View>  
                            </TouchableOpacity>
                        </ScrollView>
                        <View style={{width: '100%', alignItems: 'center', paddingVertical: 10}}>
                            <TouchableOpacity onPress={() => {updateTruck()}}>
                                <View style={{padding: 5, paddingHorizontal: 15, backgroundColor: 'green', borderRadius: 15}}>
                                    <Text style={{fontSize: 18, fontWeight: 800, color: 'white'}}>SAVE EDIT</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {!inputFocus && <TouchableOpacity onPress={() => {clear(); close()}} style={{position: 'absolute', width: '100%', height: '100%'}} />}
                </View>
            </TouchableWithoutFeedback>
        </>
    );
}