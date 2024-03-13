import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Image, Modal } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db, auth, storage, firebase } from "../firebase_config";
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

import EditTruck from "./EditTruckForm";

export default function TruckInfo({ truckID, setViewTruckFunction, currentPage }) {
    const [users, setUsers] = useState([]);
    const [trucks, setTrucks] = useState([]);
    const [openEdit, setOpenEdit] = useState(false);
    const [passDriver, setPassDriver] = useState();

    const userRef = firebase.firestore().collection("users");
    const trucksRef = firebase.firestore().collection("trucks");

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

    const openCloseEdit = async() => {
        let drvrID;
        trucks.map((truck) => {
            if(truck.id === truckID) {
                drvrID = truck.driverID;
            }
        })
        users.map((user) => {
            if(user.id === drvrID) {
                setPassDriver(user.firstName + ' ' + user.lastName);
            }
        })

        if(!openEdit) {
            setOpenEdit(true);
        } else if(openEdit) {
            setOpenEdit(false);
        }
    }

    const deleteTruck = async() => {
        const docRef = doc(db, 'trucks', truckID);
        await deleteDoc(docRef);
    }

    function BodyContent() {
        let plateNo, driverName;

        trucks.map((truck) => {
            if(truck.id === truckID) {
                plateNo = truck.plateNo;
            }
        })

        trucks.map((truck) => {
            if(truck.id === truckID) {
                users.map((user) => {
                    if(user.id === truck.driverID) {
                        driverName = user.firstName + ' ' + user.lastName;
                    }
                })
            }
        })

        function CollectorList() {
            let tempColID, tempColName;
            trucks.map((truck) => {
                if(truck.id === truckID) {
                    truck.members.collector.map((col) => {
                        users.map((user) => {
                            if(user.id === col.id) {
                                tempColID = user.id;
                                tempColName = user.firstName + ' ' + user.lastName;
                            }
                        })
                    })
                }
            })
            return (
                <>
                    <Text key={tempColID} style={{backgroundColor: '#DCF3B6', padding: 10, marginBottom: 5, borderRadius: 5, fontSize: 15}}>{tempColName}</Text>
                </>
            );
        }

        return (
            <>
                <View style={{display: 'flex', width: '100%', gap: 5}}>
                    <View style={{display: 'flex', width: '100%', alignItems: 'center', marginBottom: 10}}>
                        <Text style={{fontSize: 18, fontWeight: 500}}>Plate Number</Text>
                        <Text style={{fontSize: 30, fontWeight: 900}}>{plateNo}</Text>
                    </View>
                    
                    <View style={{display: 'flex', width: '100%', flexDirection: 'column', alignItems: 'flex-start'}}>
                        <View style={{display: 'flex', flex: 0}}>
                            <Text style={{fontSize: 18, fontWeight: 700, color: 'green'}}>Driver:</Text>
                        </View>
                        <View style={{display: 'flex', flex: 0, width: '100%'}}>
                            <TextInput
                                value={driverName}
                                editable={false}
                                style={{
                                    width: '100%',
                                    fontSize: 16,
                                    // fontWeight: 600,
                                    padding: 5,
                                    backgroundColor: 'rgb(189,228,124)',
                                    borderRadius: 5,
                                    paddingLeft: 10,
                                    color: 'black'
                                }}
                            />
                        </View>
                    </View>

                    <View style={{display: 'flex', width: '100%', flexDirection: 'column', alignItems: 'flex-start'}}>
                        <View style={{display: 'flex', flex: 0}}>
                            <Text style={{fontSize: 18, fontWeight: 700, color: 'green'}}>Collectors:</Text>
                        </View>
                        <View style={{display: 'flex', flex: 0, width: '100%'}}>
                            <View style={{width: '100%', height: 150, backgroundColor: "rgb(189,228,124)", borderRadius: 5}}>
                                <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{width: '100%', height: '100%', padding: 5}}>
                                    <TouchableOpacity activeOpacity={1}>
                                        <CollectorList />
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </View>
                    </View>
                </View>
            </>
        );
    }

    return (
        <>
            {!openEdit ?
                <Modal animationType='fade' transparent={true} statusBarTranslucent={true}>
                    <View style={{position: 'absolute', display: 'flex', flex: 1, width: '100%', height: '100%', padding: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 5}}>
                        <Text style={{fontSize: 20, fontWeight: 900, color: 'green', marginTop: -100, zIndex: 25, transform:[{translateY: 38}]}}>TRUCK INFORMATION</Text>
                        <View style={{display: 'flex', width: '100%', padding: 10, backgroundColor: 'white', borderRadius: 10, zIndex: 20}}>
                            <View style={{width: '100%', alignItems: 'flex-end', marginBottom: 20}}>
                                <TouchableOpacity onPress={() => {setViewTruckFunction()}} style={{zIndex: 15}}>
                                    <View style={{padding: 1, paddingHorizontal: 2, backgroundColor: '#E8A319', borderRadius: 5}}>
                                        <Ionicons name="close" style={{fontSize: 20, color: 'white'}} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <BodyContent />
                        </View>
                        {(currentPage === 'Manage Page') &&
                            <View style={{display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center', marginTop: 10, gap: 20}}>
                                <TouchableOpacity activeOpacity={0.7} onPress={() => {deleteTruck(); setViewTruckFunction();}} style={{zIndex: 20}}>
                                    <View style={{backgroundColor: '#DE462A', padding: 5, paddingHorizontal: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5}}>
                                        <Ionicons name='trash' style={{fontSize: 19, color: 'white'}} />
                                        <Text style={{fontSize: 19, fontWeight: 800, color: 'white'}}>DELETE</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity activeOpacity={0.7} onPress={() => {openCloseEdit()}} style={{zIndex: 20}}>
                                    <View style={{backgroundColor: '#E8A319', padding: 5, paddingHorizontal: 26, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5}}>
                                        <Ionicons name='pencil' style={{fontSize: 19, color: 'white'}} />
                                        <Text style={{fontSize: 19, fontWeight: 800, color: 'white'}}>EDIT</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        }
                        <TouchableOpacity onPress={() => {setViewTruckFunction()}} style={{position: 'absolute', display: 'flex', flex: 1, width: '100%', height: '100%', zIndex: 10}} />
                    </View>
                </Modal>
                :
                <EditTruck close={openCloseEdit} truckID={truckID} driverFName={passDriver} />
            }
        </>
    );
}