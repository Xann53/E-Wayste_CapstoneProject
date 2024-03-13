import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Image, Modal } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from '../environments';

import { db, auth, storage, firebase } from "../firebase_config";
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function AddLoc({ lat, lon, locGeocode, open }) {
    const [tempLat, setTempLat] = useState();
    const [tempLon, setTempLon] = useState();
    const [tempLoc, setTempLoc] = useState();

    return (
        <>
            <Modal animationType='slide' transparent={true} statusBarTranslucent={true}>
                <View style={{position: 'absolute', zIndex: 99, height: '100%', width: '100%', padding: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}}>
                    <View style={{width: '100%', height: 120, backgroundColor: 'white', padding: 20, borderRadius: 10, justifyContent: 'flex-end', transform: [{translateY: -90}]}}>
                        <View style={{width: '113%', position: 'absolute', paddingHorizontal: 20, paddingTop: 20, top: 0, zIndex: 100}}>
                            <GooglePlacesAutocomplete
                                placeholder='Search'
                                fetchDetails
                                enablePoweredByContainer={false}
                                onPress={(data, details = null) => {
                                    let searchLongitude, searchLatitude;
                                    searchLatitude = details.geometry.location.lat;
                                    searchLongitude = details.geometry.location.lng;
                                    console.log(searchLatitude, searchLongitude);
                                    setTempLat(searchLatitude+"");
                                    setTempLon(searchLongitude+"");
                                    // setTempLoc(data.description);
                                }}
                                query={{
                                    key: GOOGLE_API_KEY,
                                    language: 'en',
                                }}
                                styles={{
                                    textInput: {
                                        height: 38,
                                        fontSize: 14,
                                        marginTop: 3,
                                        shadowColor: 'black',
                                        shadowOffset:{width: 2, height: 2},
                                        shadowOpacity: 0.4,
                                        shadowRadius: 4,
                                        elevation: 4,
                                    },
                                    listView: {
                                        backgroundColor:'#c8c7cc',
                                    },
                                    row: {
                                        backgroundColor: '#FFFFFF',
                                        padding: 9,
                                        height: 38,
                                        marginVertical: 0.01,
                                    },
                                    description: {
                                        fontSize: 12
                                    },
                                }}
                            />
                        </View>
                        <View style={{width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 10}}>
                            <TouchableOpacity activeOpacity={0.5} onPress={() => {lat(tempLat); lon(tempLon); locGeocode(tempLat, tempLon); open(false)}}>
                                <View style={{backgroundColor: 'green', padding: 5, width: 70, alignItems: 'center', borderRadius: 5}}>
                                    <Text style={{color: 'white', fontWeight: 700}}>Search</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity activeOpacity={0.5} onPress={() => {open(false)}}>
                                <View style={{backgroundColor: 'orange', padding: 5, width: 70, alignItems: 'center', borderRadius: 5}}>
                                    <Text style={{color: 'white', fontWeight: 700}}>Close</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}