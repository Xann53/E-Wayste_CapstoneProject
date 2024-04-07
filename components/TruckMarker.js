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

export default function TruckPin({ track }) {
    return (
        <>
            {track.coordinates.map(marker => (
                <Marker
                    key={marker.name}
                    coordinate={{
                        latitude: parseFloat(marker.latitude),
                        longitude: parseFloat(marker.longitude)
                    }}
                    style={{zIndex: 95}}
                >
                    <Image source={require('../assets/garbage-truck.png')} style={{width: 45, height: 40}} />
                    <Callout>
                        <View style={{width: 150, alignItems: 'center'}}>
                            <Text>Collector: {marker.collectorName}</Text>
                        </View>
                    </Callout>
                </Marker>
            ))}
        </>
    );
}