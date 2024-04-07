import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image, Modal } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db, auth, storage, firebase } from '../firebase_config';
import { collection, addDoc, getDocs, query, updateDoc, doc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

import * as Location from 'expo-location';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from '../environments';
import MapViewDirections from 'react-native-maps-directions';

export default function DisplayRepInfo({ infoID, setInfoID, infoImage, mapType, users, userUploads, changeStatus, page }) {
    let colStatus;
    let userId, description, location, dateTime;

    const getInfo = async() => {
        userUploads.map((upload) => {
            if(upload.id.includes(infoID)) {
                userId=upload.userId;
                description=upload.description;
                location=upload.location;
                dateTime=upload.dateTime;

                if(upload.status === 'uncollected')
                    colStatus = 'uncollected';
                else if(upload.status === 'collected')
                    colStatus = 'collected';
            }
        })
    }
    
    return (getInfo(), (
        <>
            {infoID &&
                <View style={{position: 'absolute', backgroundColor: 'white', zIndex: 30, margin: 20, height: 150, width: '90%', padding: 5, bottom: '10.5%', shadowColor: 'black', borderRadius: 15, shadowOffset:{width: 3, height: 3}, shadowOpacity: 1, shadowRadius: 4, elevation: 4}}>
                    <View style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'row'}}>
                        <View style={{flex: 1, backgroundColor: '#E4EEEA', padding: 5, borderRadius: 10}}>
                            <Image style={{width: '100%', height: '100%',  flex: 1, resizeMode: 'cover', borderRadius: 5}} source={{uri: infoImage}} />
                        </View>
                        <View style={{flex: 2}}>
                            <View style={{flex: 1, padding: 5, overflow: 'hidden'}}>
                                <View style={{flex: 4}}>
                                    <Text style={{fontSize: 18, fontWeight: 700, color: 'green'}}>{users.map((user) => {if(user.id.includes(userId))return user.username})}</Text>
                                    <Text style={{fontSize: 10}}>{dateTime}</Text>
                                    <Text style={{fontSize: 12, marginTop: 10}}><Ionicons name='location' /> {location}</Text>
                                </View>
                                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                    {mapType === 'uncollected' ?
                                        <>
                                            {colStatus === 'uncollected' ?
                                                <TouchableOpacity disabled={(page === 'Resident') ? true : false} style={{flex: 1, width: '70%', borderRadius: 10, overflow: 'hidden'}} activeOpacity={0.5} onPress={() => {setInfoID(); changeStatus(infoID, 'UNCOLLECTED')}}>
                                                    <View style={{flex: 1, backgroundColor: 'green', justifyContent: 'center', alignItems: 'center'}}>
                                                        <Text style={{fontWeight: 700, color: 'white'}}>COLLECT</Text>
                                                    </View>
                                                </TouchableOpacity>
                                                :
                                                <View style={{flex: 1, width: '70%', borderRadius: 10, overflow: 'hidden', backgroundColor: '#E5E5E5', justifyContent: 'center', alignItems: 'center'}}>
                                                    <Text style={{fontWeight: 700, color: 'grey'}}>COLLECTED</Text>
                                                </View>
                                            }
                                        </>
                                        :
                                        <>
                                            {colStatus === 'collected' ?
                                                <TouchableOpacity disabled={(page === 'Authority') ? false : true} style={{flex: 1, width: '70%', borderRadius: 10, overflow: 'hidden'}} activeOpacity={0.5} onPress={() => {setInfoID(); changeStatus(infoID, 'COLLECTED')}}>
                                                    <View style={{flex: 1, backgroundColor: '#E5E5E5', justifyContent: 'center', alignItems: 'center'}}>
                                                        <Text style={{fontWeight: 700, color: 'grey'}}>COLLECTED</Text>
                                                    </View>
                                                </TouchableOpacity>
                                                :
                                                <View style={{flex: 1, width: '70%', borderRadius: 10, overflow: 'hidden', backgroundColor: 'green', justifyContent: 'center', alignItems: 'center'}}>
                                                    <Text style={{fontWeight: 700, color: 'white'}}>COLLECT</Text>
                                                </View>
                                            }
                                        </>
                                    }
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity activeOpacity={0.5} onPress={() => {setInfoID()}}>
                            <View style={{position: 'absolute', height: 20, width: 20, backgroundColor: '#E5E5E5', right: 5, top: 5, borderRadius: 100}}>
                                <Ionicons name='close' style={{fontSize: 20, color: 'grey'}} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            }
        </>
    ));
}