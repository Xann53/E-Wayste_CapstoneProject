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

export default function RepMarker({ mapType, state, setInfoID, setInfoImage }) {
    return (
        <>
            {mapType === 'uncollected' ?
                <>
                    {state.coordinates.map(marker => (
                        <Marker
                            key={marker.name}
                            coordinate={{
                                latitude: parseFloat(marker.latitude),
                                longitude: parseFloat(marker.longitude)
                            }}
                            onPress={() => {setInfoID(marker.name); setInfoImage(marker.image)}}
                            style={{zIndex: 100, alignItems: 'center'}}
                        >
                            <Ionicons name='location' style={{fontSize: 30, color: '#F76811'}} />
                            <Callout>
                                <View style={{width: 80, height: 80}}>
                                    <Text style={{position: 'absolute', top: -35, paddingBottom: 40}}>
                                        <Image style={{width: 80, height: 80}} source={{uri: marker.image}} />
                                    </Text>
                                </View>
                            </Callout>
                        </Marker>
                    ))}
                </>
                :
                <>
                    {state.coordinates.map(marker => (
                        <Marker
                            key={marker.name}
                            coordinate={{
                                latitude: parseFloat(marker.latitude),
                                longitude: parseFloat(marker.longitude)
                            }}
                            onPress={() => {setInfoID(marker.name); setInfoImage(marker.image)}}
                            style={{zIndex: 100, alignItems: 'center'}}
                        >
                            <Ionicons name='location' style={{fontSize: 30, color: '#24E559'}} />
                            <Callout>
                                <View style={{width: 80, height: 80}}>
                                    <Text style={{position: 'absolute', top: -35, paddingBottom: 40}}>
                                        <Image style={{width: 80, height: 80}} source={{uri: marker.image}} />
                                    </Text>
                                </View>
                            </Callout>
                        </Marker>
                    ))}
                </>
            }
        </>
    );
}