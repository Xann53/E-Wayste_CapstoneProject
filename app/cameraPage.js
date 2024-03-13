import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Keyboard, Image, Switch } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from 'react-native-uuid';
import moment from 'moment/moment';
import * as Location from 'expo-location';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { Camera, CameraType, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused } from '@react-navigation/native';

import { db, auth, storage, firebase } from '../firebase_config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from '../environments';
import PushNotif from '../components/PushNotification';

import AddLoc from '../components/AddLocPanel';

export default function CameraOpen({ navigation: {goBack} }) {
    const isFocused = useIsFocused();
    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
    const [location, setLocation] = useState(null);
    const [description, setDescription] = useState(null);
    const [locationAdjust, setLocationAdjust] = useState(false);
    const [longitude, setLongitude] = useState(null);
    const [latitude, setLatitude] = useState(null);
    const [openSearch, setOpenSearch] = useState(false);
    const [municipality, setMunicipality] = useState();

    const [image, setImage] = useState(null);
    const [type, setType] = useState(CameraType.back);
    const [flash, setFlash] = useState(Camera.Constants.FlashMode.off);
    const cameraRef = useRef(null);

    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);

    const [users, setUsers] = useState();
    const userRef = firebase.firestore().collection("users");

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

    const completeLoc = async(address) => {
        let finalAddress = '';
        if(address[0].streetNumber !== null)
            finalAddress = finalAddress + address[0].streetNumber + ', ';
        if(address[0].street !== null)
            finalAddress = finalAddress + address[0].street + ', ';
        if(address[0].name !== null)
            finalAddress = finalAddress + address[0].name + ', ';
        if(address[0].district !== null)
            finalAddress = finalAddress + address[0].district + ', ';
        if(address[0].city !== null)
            finalAddress = finalAddress + address[0].city + ', ';
        if(address[0].subregion !== null)
            finalAddress = finalAddress + address[0].subregion + ', ';
        if(address[0].region !== null)
            finalAddress = finalAddress + address[0].region + ' region, ';
        if(address[0].country !== null)
            finalAddress = finalAddress + address[0].country;
        setLocation(finalAddress);
        console.log(address[0].city);
        setMunicipality(address[0].city);
    }

    const userLocation = async () => {
        let {status} = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
        }
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLatitude(currentLocation.coords.latitude+"");
        setLongitude(currentLocation.coords.longitude+"");

        const address = await Location.reverseGeocodeAsync({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude
        });
        
        completeLoc(address);
    }

    if (isEnabled) {userLocation();}

    const reverseGeocode = async (tempLat, tempLon) => {
        try {
            const address = await Location.reverseGeocodeAsync({
                latitude: parseFloat(tempLat),
                longitude: parseFloat(tempLon)
            });
            
            completeLoc(address);
        } catch(e) {console.log(e)}
    }

    useEffect(() => {
        (async () => {
            const cameraStatus = await Camera.requestCameraPermissionsAsync();
            setHasCameraPermission(cameraStatus.status === 'granted');

            const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
            setHasGalleryPermission(galleryStatus.status === 'granted');
        })();
    }, [])

    const takePicture = async () => {
        if(cameraRef) {
            try {
                const data = await cameraRef.current.takePictureAsync();
                console.log(data);
                setImage(data);
            } catch(e) {
                console.log(e);
            }
        }
    }

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1
            });
            console.log(result.assets[0]);
            setImage(result.assets[0]);
        } catch(e) {}
    }

    const uploadImage = async () => {
        const imageURI = image.uri;
        const imageName = imageURI.substring(imageURI.lastIndexOf('/') + 1);
        const finalImageName = uuid.v1() + imageName;
        const imageDestination = 'postImages/' + finalImageName;
        
        const response = await fetch(imageURI);
        const blob = await response.blob();
        const imageRef = ref(storage, imageDestination);
        uploadBytes(imageRef, blob).then(() => {
            alert("Image Uploaded");
        });

        const fullDateTime = moment()
            .utcOffset('+08:00')
            .format('YYYY/MM/DD hh:mm:ss a');

        const userID = await AsyncStorage.getItem('userId');

        const genUserUploadCol = collection(db, 'generalUsersReports')
        await addDoc(genUserUploadCol, {
            associatedImage: finalImageName,
            location: location,
            description: description,
            dateTime: fullDateTime,
            status: 'uncollected',
            userId: userID,
            longitude: longitude,
            latitude: latitude,
            municipality: municipality
        });

        let userFullName;
        users.map((user) => {
            if(user.id.includes(userID)) {
                userFullName = user.firstName + ' ' + user.lastName;
            }
        });

        const title = 'NEW GARBAGE REPORT!';
        const body = userFullName + ' has submitted a report for collection';
        PushNotif(title, body, fullDateTime);

        setImage(null);
        goBack();
    }

    if(hasCameraPermission === false && hasGalleryPermission === false) {
        return (
            <View style={{height: '100%', width: '100%', backgroundColor: 'black', justifyContent: 'center', alignItems: 'center'}}>
                <View style={{height: 300, width: '80%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', borderRadius: 30, padding: 5}}>
                    <Text style={{fontWeight: 700, fontSize: 16}}>Access to Device has not been Granted</Text>
                    <View style={{marginTop: 30, marginBottom: 50}}>
                        <Text>In order to change permission:</Text>
                        <Text>1. Go to Settings and then "Apps"</Text>
                        <Text>2. Locate and Click on (App Name Here)</Text>
                        <Text>3. Click "Permissions" and allow permission</Text>
                    </View>
                    <Button title="BACK TO HOME" onPress={() => {goBack();}} />
                </View>
            </View>
        );
    }
    else {
        if(isFocused) {
            return (
                <>
                    <View style={styles.container}>
                        {!image ?
                            <Camera 
                                style={{height: '70%', borderRadius: 20}}
                                type={type}
                                flashMode={flash}
                                ref={cameraRef}
                            />
                            :
                            <View style={{display: 'flex', flex: 1, width: '100%', backgroundColor: 'white'}}>
                                <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{marginBottom: 60}}>
                                        <View style={{width: '100%', alignItems: 'center'}}>
                                            <Text style={{marginTop: 20, marginBottom: 8, fontSize: 20, fontWeight: 900, color: 'green'}}>WASTE REPORT</Text>

                                            <View style={{height: 480, width: '95%', padding: 5, backgroundColor: 'rgb(245, 245, 245)', borderRadius: 5, borderWidth: 1, borderColor: 'rgb(235, 235, 235)'}}>
                                                <Image source={{uri: image.uri}} style={{flex: 1, resizeMode: 'contain'}} />
                                            </View>
                                           
                                            <View style={{width: '95%', flexDirection: 'column', marginTop: 15, justifyContent: 'space-between'}}>
                                                
                                                <View style={{display: 'flex', flexDirection: 'row', flex: 1, marginBottom: 5, gap: 5}}>
                                                    <TouchableOpacity activeOpacity={0.7} style={{display: 'flex', flex: 1}} onPress={() => {locationAdjust ? setLocationAdjust(false) : setLocationAdjust(true)}}>
                                                        <TextInput
                                                            editable={false}
                                                            value={location}
                                                            style={{
                                                                height: 40,
                                                                width: '100%',
                                                                backgroundColor: 'rgb(189,227,124)',
                                                                borderRadius: 5,
                                                                color: "rgba(45, 105, 35, 1)",
                                                                paddingHorizontal: 15
                                                            }}
                                                            placeholder='Set Location'
                                                            selection={{start: 0}}
                                                        />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity activeOpacity={0.7} style={{display: 'flex', flex: 0.15, backgroundColor: '#DE462A', justifyContent: 'center', alignItems: 'center', borderRadius: 5}} onPress={() => {setLocation(null); setLatitude(null); setLongitude(null); setIsEnabled(false)}}>
                                                        <Ionicons name='trash' style={{color: 'white', fontSize: 25}} />
                                                    </TouchableOpacity>
                                                </View>
                                                
                                                {locationAdjust &&
                                                    <View style={{width: '100%', alignItems: 'center', gap: 5}}>

                                                        <View style={{display: 'flex', flexDirection: 'row', flex: 1, gap: 5}}>
                                                            <View style={{display: 'flex', flex: 1, height: 50, borderRadius: 5, backgroundColor: '#f3f5f0', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 20}}>
                                                                <Text style={{color: '#454545'}}>Set current location</Text>
                                                                <Switch
                                                                    style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1 }] }}
                                                                    trackColor={{false: '#767577', true: 'rgb(189,227,124)'}}
                                                                    thumbColor={isEnabled ? '#6fa663' : '#f4f3f4'}
                                                                    onValueChange={toggleSwitch}
                                                                    value={isEnabled}
                                                                />
                                                            </View>
                                                            <TouchableOpacity activeOpacity={isEnabled ? 1 : 0.7} onPress={() => {!isEnabled && setOpenSearch(true)}} style={{display: 'flex', flex: 0.3, height: 50, borderRadius: 5, backgroundColor: isEnabled ? '#DDC1A2' : 'orange', justifyContent: 'center', alignItems: 'center', flexDirection: 'row'}}>
                                                                <Text style={{color: isEnabled ? '#EBEBEB' : 'white', fontWeight: 900, fontSize: 15}}>Search</Text>
                                                            </TouchableOpacity>
                                                        </View>

                                                        <View style={{width: '100%', height: 300, overflow: 'hidden', borderRadius: 10, borderWidth: 0.5, marginBottom: 10}}>
                                                            <MapView
                                                                style={{width: '100%', height: '120%'}}
                                                                provider={PROVIDER_GOOGLE}
                                                                initialRegion={{
                                                                    latitude: 10.3156992,
                                                                    longitude: 123.88543660000005,
                                                                    latitudeDelta: 0.0922,
                                                                    longitudeDelta: 0.0421,
                                                                }}
                                                                customMapStyle={mapStyle}
                                                            >
                                                                {(latitude !== null && longitude !== null) && 
                                                                    <Marker
                                                                        key='Location'
                                                                        coordinate={{
                                                                            latitude: parseFloat(latitude),
                                                                            longitude: parseFloat(longitude)
                                                                        }}
                                                                        style={{zIndex: 95}}
                                                                        draggable
                                                                        onDragEnd={(e) => {
                                                                            setLatitude(e.nativeEvent.coordinate.latitude);
                                                                            setLongitude(e.nativeEvent.coordinate.longitude);
                                                                            reverseGeocode(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);
                                                                        }}
                                                                    >
                                                                        <Ionicons name='location' style={{fontSize: 25, color: '#D41818'}} />    
                                                                    </Marker>
                                                                }
                                                            </MapView>
                                                        </View>

                                                    </View>
                                                }
                                            </View>

                                            <TextInput
                                                style={{
                                                    height: 150,
                                                    width: '95%',
                                                    backgroundColor: 'rgb(189,227,124)',
                                                    borderRadius: 5,
                                                    borderWidth: 0.5,
                                                    borderColor: "rgb(215,233,217)",
                                                    color: "rgba(45, 105, 35, 1)",
                                                    padding: 15,
                                                    paddingRight: 8,
                                                    textAlignVertical: 'top',
                                                    marginTop: 5,
                                                    marginBottom: 20
                                                }}
                                                placeholder='Add Description'
                                                multiline={true}
                                                onChangeText={(e) => {setDescription(e)}}
                                            />
                                        </View>
                                </ScrollView>
                                <View style={{display: 'flex', flexDirection: 'row', position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', alignItems: 'center', paddingVertical: 10, justifyContent: 'space-between', paddingHorizontal: 50, borderTopRightRadius: 10, borderTopLeftRadius: 10, shadowColor: 'black', shadowOpacity: 1, elevation: 4}}>
                                    <View style={{height:45, width: 130, backgroundColor: 'black', borderRadius: 100, overflow: 'hidden', shadowColor: 'black', shadowOpacity: 1, elevation: 3}}>
                                        <TouchableOpacity style={{width: '100%', height: '100%'}} activeOpacity={0.8} onPress={() => {setImage(null)}}>
                                            <View style={{width: '100%', height: '100%', backgroundColor: 'rgb(81,175,91)', justifyContent: 'center', alignItems: 'center'}}>
                                                <Text style={{fontWeight: 900, color: 'white'}}>RETAKE</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{height:45, width: 130, backgroundColor: 'black', borderRadius: 100, overflow: 'hidden', shadowColor: 'black', shadowOpacity: 1, elevation: 3}}>
                                        <TouchableOpacity style={{width: '100%', height: '100%'}} activeOpacity={0.8} onPress={() => {uploadImage()}}>
                                            <View style={{width: '100%', height: '100%', backgroundColor: 'rgb(81,175,91)', justifyContent: 'center', alignItems: 'center'}}>
                                                <Text style={{fontWeight: 900, color: 'white'}}>POST</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        }
                        {image ?
                            <></>
                            :
                            <View style={{alignItems: 'center', paddingVertical: 5, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 5, marginTop: 10}}>
                                <TouchableOpacity activeOpacity={0.9} onPress={() => {goBack();}}>
                                    <View style={{backgroundColor: 'rgba(0,0,0,0)', justifyContent: 'center', alignItems: 'center', height: 60, width: 60, borderRadius: 1000}}>
                                        <Ionicons name='arrow-undo-outline' style={{color: 'white', fontSize: 28}} />
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity activeOpacity={0.9} onPress={() => {
                                    setType(type === CameraType.back ? CameraType.front : CameraType.back)
                                }}>
                                    <View style={{backgroundColor: 'rgba(0,0,0,0)', justifyContent: 'center', alignItems: 'center', height: 60, width: 60, borderRadius: 1000}}>
                                        <Ionicons name={type === CameraType.back ? 'camera-reverse-outline' : 'camera-reverse'} style={{color: 'white', fontSize: 28}} />
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity activeOpacity={0.9} onPress={takePicture}>
                                    <View style={{backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', height: 60, width: 60, borderRadius: 1000, marginHorizontal: 20}}>
                                        <Ionicons name="camera" style={{color: 'rgb(81,175,91)', fontSize: 40}} />
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity activeOpacity={0.9} onPress={() => {
                                    setFlash(flash === Camera.Constants.FlashMode.off ? Camera.Constants.FlashMode.on : Camera.Constants.FlashMode.off)
                                }}>
                                    <View style={{backgroundColor: 'rgba(0,0,0,0)', justifyContent: 'center', alignItems: 'center', height: 60, width: 60, borderRadius: 1000}}>
                                        <Ionicons name={flash === Camera.Constants.FlashMode.off ? 'flash-outline' : 'flash'} style={{color: 'white', fontSize: 25}} />
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity activeOpacity={0.9} onPress={pickImage}>
                                    <View style={{backgroundColor: 'rgba(0,0,0,0)', justifyContent: 'center', alignItems: 'center', height: 60, width: 60, borderRadius: 1000}}>
                                        <Ionicons name='image-outline' style={{color: 'white', fontSize: 28}} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        }
                    </View>
                    
                    {openSearch && <AddLoc open={setOpenSearch} lat={setLatitude} lon={setLongitude} locGeocode={reverseGeocode} />}
                </>
            );
        } else if(!isFocused) {
            return null;
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'black',
    },
})

const mapStyle = [
    {
        elementType: 'labels.icon',
        stylers: [
            {
                visibility: 'off',
            },
        ],
    },
    {
        featureType: 'poi.business',
        stylers: [
            {
                visibility: 'off',
            },
        ],
    },
];