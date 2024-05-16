import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image, Modal } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from 'moment/moment';

import { db, auth, storage, firebase } from '../firebase_config';
import { collection, addDoc, getDocs, query, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { returnKeyType } from 'deprecated-react-native-prop-types/DeprecatedTextInputPropTypes';

export default function RecordView({ open, allSched, schedId }) {
    return(
        <>
            <Modal animationType='fade' visible={true} transparent={true} statusBarTranslucent={true}>
                <View style={{display: 'flex', flexDirection: 'row', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)'}}>
                    <View style={{display: 'flex', backgroundColor: 'white', height: '85%', width: '90%', borderRadius: 15, padding: 10}}>
                        <View style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
                            <View style={{display: 'flex', flex: 1}} />
                            <View style={{display: 'flex', flex: 10, flexDirection: 'row', justifyContent: 'center'}}>
                                <Text style={{fontSize: 16, fontWeight: 900, letterSpacing: 1, color: 'green'}}>COLLECTION RECORD</Text>
                            </View>
                            <View style={{display: 'flex', flex: 1, flexDirection: 'row', justifyContent: 'flex-end'}}>
                                <TouchableOpacity onPress={() => {open(false)}}>
                                    <View style={{padding: 1, paddingHorizontal: 2, backgroundColor: '#E8A319', borderRadius: 5}}>
                                        <Ionicons name="close" style={{fontSize: 20, color: 'white'}} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={{display: 'flex', flexDirection: 'row', width: '100%', marginTop: 15, justifyContent: 'space-evenly', gap: 5, paddingHorizontal: 15}} />
                        <View style={{display: 'flex', flex: 10, width: '100%', marginTop: 10}}>
                            <ScrollView style={{display: 'flex', flex: 1, width: '100%',  backgroundColor: "rgb(179,229,94)", borderRadius: 10, padding: 10, shadowColor: 'black'}}>
                                <View style={{display: 'flex', flex: 1, width: '100%', gap: 5, marginBottom: 20}}>
                                    {allSched.map((sched) => {
                                        if(sched.id === schedId) {
                                            return(
                                                sched.collectionRecord.map((record) => {
                                                    return(
                                                        <View key={record.dateTimeCollected} style={{display: 'flex', flexDirection: 'row', flex: 1, backgroundColor: 'white', padding: 10, borderRadius: 5, justifyContent: 'center'}}>
                                                            <Text style={{color: 'rgb(81,175,91)', fontWeight: 700, letterSpacing: 1}}>{record.dateTimeCollected}</Text>
                                                        </View>
                                                    );
                                                })
                                            );
                                        }
                                    })}
                                </View>
                            </ScrollView>
                        </View>
                        <View style={{display: 'flex', flex: 0.6, marginTop: 10, justifyContent: 'center', alignItems: 'center'}}>
                            {/* Here Buttons if Needed */}
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => {open(false)}} style={{position: 'absolute', zIndex: -1, backgroundColor: 'rgba(0,0,0,0)', width: '100%', height: '100%'}} />
                </View>
            </Modal>
        </>
    );
}