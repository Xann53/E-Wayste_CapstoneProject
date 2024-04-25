import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image, Modal } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from '@react-navigation/native';
import moment from 'moment/moment';

import { db, auth, storage, firebase } from '../firebase_config';
import { collection, addDoc, getDocs, query, updateDoc, doc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

import * as Location from 'expo-location';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from '../environments';
import MapViewDirections from 'react-native-maps-directions';

import OpenSideBar from '../components/OpenSideNav';
import PushNotif from '../components/PushNotification';
import LoadMap from '../components/ShowMap';

export default function MapAut({ navigation }) {
    let searchLongitude, searchLatitude;
    const isFocused = useIsFocused();
    const mapRef = useRef(null);
    const [openSideBar, setOpenSideBar] = useState();

    useEffect(() => {
        if(!isFocused) {
            setOpenSideBar();
        }
    });

    function SideNavigation(navigation) {
        const closeSideNav = async() => {
            setOpenSideBar();
        }

        return (
            <OpenSideBar navigation={navigation} close={closeSideNav} />
        );
    }

    const moveCameraTo = (latitude, longitude) => {
        const region = {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.02,
        };
      
        mapRef.current.animateToRegion(region, 1000);
    }

    return (
        <>
            {isFocused ?
                <>
                    <View style={{position: 'absolute', zIndex: 99, width: '100%', paddingTop: 20, flexDirection: 'row', paddingHorizontal: 20}}>
                        <TouchableOpacity style={{ zIndex: 99, marginRight: '2%', height: 42, justifyContent: 'center', alignItems: 'center', borderRadius: 100 }} onPress={() => {setOpenSideBar(SideNavigation(navigation))}}>
                            <Ionicons name='menu' style={{ fontSize: 40, color: 'rgb(70,149,78)' }} />
                        </TouchableOpacity>
                        <View style={{ flex: 2, zIndex: 99 }}>
                            <GooglePlacesAutocomplete
                                placeholder='Search'
                                fetchDetails
                                enablePoweredByContainer={false}
                                onPress={(data, details = null) => {
                                    searchLatitude = details.geometry.location.lat;
                                    searchLongitude = details.geometry.location.lng;
                                    moveCameraTo(searchLatitude, searchLongitude);
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
                    </View>
                    {openSideBar}
                    <View>
                        <View style={{height: 70, backgroundColor: 'rgba(126, 185, 73, 1)', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, zIndex: 90, shadowColor: 'black', shadowOffset:{width: 3, height: 3}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4}} />
                        <View style={{display: 'flex', height: '91%', justifyContent: 'center', alignItems: 'center', top: -10}}>
                            <LoadMap mapRef={mapRef} page={'Authority'} />
                        </View>
                    </View>
                </>
                :
                <></>
            }
        </>
    );
}
