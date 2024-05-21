import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Image, Modal } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db, auth, storage, firebase } from "../firebase_config";
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, listAll, getDownloadURL,  uploadBytes} from 'firebase/storage';

import TruckInfo from "./ViewTruckInfo";

export default function TruckList({ dataList, selected, close }) {
    const [truckID, setTruckID] = useState();
    const [openInfo, setOpenInfo] = useState(false);

    const closeInfo = async() => {
        setOpenInfo(false);
    }

    return (
        <>
            {(!openInfo) ?
                <>
                    <Modal animationType='fade' visible={true} transparent={true} statusBarTranslucent={true}>
                        <View style={{display: 'flex', flexDirection: 'row', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)'}}>
                            <View style={{display: 'flex', flex: 1, backgroundColor: 'white', height: '35%', borderRadius: 15, padding: 10, marginHorizontal: 50}}>
                                <View style={{display: 'flex', width: '100%', alignItems: 'flex-end'}}>
                                    <TouchableOpacity onPress={close}>
                                        <View style={{padding: 1, paddingHorizontal: 2, backgroundColor: '#E8A319', borderRadius: 5}}>
                                            <Ionicons name="close" style={{fontSize: 20, color: 'white'}} />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                                <View style={{display: 'flex', flex: 1, width: '100%', marginTop: 10}}>
                                    <ScrollView style={{display: 'flex', flex: 1, width: '100%',  backgroundColor: "rgb(189,228,124)", borderRadius: 10, padding: 10, shadowColor: 'black'}}>
                                        <View style={{display: 'flex', flex: 1, width: '100%', gap: 5}}>
                                            {dataList.map((truck) => {
                                                if(truck.condition !== 'inoperational') {
                                                    return(
                                                        <TouchableOpacity key={truck.id} onPress={() => {selected(truck.plateNo)}}>
                                                            <View style={{display: 'flex', flexDirection: 'row', width: '100%', padding: 10, backgroundColor: /*'#DCF3B6'*/'white', borderRadius: 5, borderWidth: 0.5}}>
                                                                <View style={{display: 'flex', flex: 2, justifyContent: 'center'}}>
                                                                    <Text style={{fontWeight: 800, fontSize: 16, color: '#B47707'}}>{truck.plateNo}</Text>
                                                                </View>
                                                                <View style={{display: 'flex', flex: 1, alignItems: 'flex-end'}}>
                                                                    <TouchableOpacity onPress={() => {setTruckID(truck.id); setOpenInfo(true)}} style={{paddingLeft: 5}}>
                                                                        <Ionicons name="document-text" style={{fontSize: 25, color: 'green'}} />
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                        </TouchableOpacity>
                                                    );
                                                }
                                            })}
                                        </View>
                                    </ScrollView>
                                </View>
                            </View>
                            <TouchableOpacity onPress={close} style={{position: 'absolute', zIndex: -1, backgroundColor: 'rgba(0,0,0,0)', width: '100%', height: '100%'}} />
                        </View>
                    </Modal>
                </>
                :
                <>
                    <TruckInfo truckID={truckID} setViewTruckFunction={closeInfo} />
                </>
            }
        </>
    );
}

// handleSelectCollector