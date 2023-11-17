import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Image } from "react-native";
import { useState, useEffect } from "react";
import CheckBox from '../../../components/CheckBox';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from 'react-native-vector-icons/Ionicons';
import uuid from 'react-native-uuid';

import { db, auth, storage } from '../../../firebase_config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { createUserWithEmailAndPassword } from 'firebase/auth';

import * as ImagePicker from 'expo-image-picker';

export default function Registration3({ navigation }) {
    const [agree, setAgree] = useState(false);
    const [province, setProvince] = useState("");
    const [municipality, setMunicipality] = useState("");
    const [barangay, setBarangay] = useState("");
    const [contactNo, setContactNo] = useState("");
    const [plateNo, setPlateNo] = useState("");
    const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
    const [image, setImage] = useState(null);
    
    const usersCollection = collection(db, "pendingUsers");

    const retrieveData = async () => {
        if ((province && municipality && barangay && contactNo) && (province.length > 0 && municipality.length > 0 && barangay.length > 0 && contactNo.length > 0) && (image !== null)) {
            try {
                const accountType = await AsyncStorage.getItem('accountType');
                const firstName = await AsyncStorage.getItem('accountFName');
                const lastName = await AsyncStorage.getItem('accountLName');
                const username = await AsyncStorage.getItem('accountUName');
                const email = await AsyncStorage.getItem('accountEmail');
                const password = await AsyncStorage.getItem('accountPass');
                AsyncStorage.flushGetRequests();
                createUser(accountType, firstName, lastName, username, email, password);
            } catch (error) {
                alert(error.message);
            }   
        } else {
            alert("Empty or Incomplete form! Unable to save data.");
        }
    }
    
    const createUser = async (accountType, firstName, lastName, username, email, password) => {
        const imageURI = image.uri;
        const imageName = imageURI.substring(imageURI.lastIndexOf('/') + 1);
        const finalImageName = uuid.v1() + imageName;
        const imageDestination = 'userWorkID/' + finalImageName;
        
        const response = await fetch(imageURI);
        const blob = await response.blob();
        const imageRef = ref(storage, imageDestination);
        uploadBytes(imageRef, blob).then(() => {
            console.log("Image Uploaded");
        });

        const account = await addDoc(usersCollection, {
            accountType: accountType,
            firstName: firstName,
            lastName: lastName,
            username: username,
            email: email,
            password: password,
            province: province,
            municipality: municipality,
            barangay: barangay,
            contactNo: contactNo,
            associatedImage: finalImageName,
            plateNo: plateNo
        });
        await AsyncStorage.clear();
        setImage(null);
        clearForm();
        Redirect();
    };

    function clearForm() {
        setProvince("");
        setMunicipality("");
        setBarangay("");
        setContactNo("");
        setPlateNo("");
    }

    function Redirect() {
        alert('Account details submitted. Pending ID verification.');
        navigation.navigate('landing');
    }

    useEffect(() => {
        (async () => {
            const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
            setHasGalleryPermission(galleryStatus.status === 'granted');
        })();
    }, [])
    
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

    return (
        <ScrollView contentContainerStyle={{flexGrow:1}}>
            <View style={styles.container}>
                <View style={{position: 'absolute',width: '100%', alignItems: 'flex-start', top: 30, left: 20}}>
                    <TouchableOpacity onPress={() => {clearForm(); navigation.navigate('register'); setImage(null)}}>
                        <Ionicons name='arrow-back' style={{fontSize: 40, color: 'rgba(16, 139, 0, 1)'}} />
                    </TouchableOpacity>
                </View>
                <View style={styles.containerFrm}>
                    <Text style={styles.title}>CREATE ACCOUNT</Text>
                    <TextInput
                        value={province}
                        style={styles.input}
                        placeholder="Province"
                        onChangeText={(e) => {setProvince(e)}}
                    />
                    <TextInput
                        value={municipality}
                        style={styles.input}
                        placeholder="Municipality"
                        onChangeText={(e) => {setMunicipality(e)}}
                    />
                    <TextInput
                        value={barangay}
                        style={styles.input}
                        placeholder="Barangay"
                        onChangeText={(e) => {setBarangay(e)}}
                    />
                    <TextInput
                        value={contactNo}
                        style={styles.input}
                        placeholder="Contact Number"
                        onChangeText={(e) => {setContactNo(e)}}
                    />
                    <TextInput
                        value={plateNo}
                        style={styles.input}
                        placeholder="Plate Number"
                        onChangeText={(e) => {setPlateNo(e)}}
                    />
                    {!image ?
                        <View style={{marginTop: 10}}>
                            <Text style={{paddingLeft: 10, color: 'rgba(45, 105, 35, 1)', fontSize: 13, fontWeight: 700}}>JOB ID PHOTO</Text>
                            <TouchableOpacity activeOpacity={0.5} onPress={pickImage} style={{height: 200, width: 280, backgroundColor: '#EEF1ED', borderRadius: 20, justifyContent: 'center', alignItems: 'center'}}>
                                <View style={{height: 150, width: 230, borderStyle: "dashed", borderWidth: 2, borderRadius: 20, borderColor: '#8E928C', justifyContent: 'center', alignItems: 'center'}}>
                                    <Ionicons name='image' style={{fontSize: 100, color: '#8E928C'}} />
                                    <Text style={{fontSize: 11, fontWeight: 700, color: '#8E928C'}}>Select Photo of ID from Gallery</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        :
                        <View style={{marginTop: 10}}>
                            <Text style={{paddingLeft: 10, color: 'rgba(45, 105, 35, 1)', fontSize: 13, fontWeight: 700}}>JOB ID PHOTO</Text>
                            <View style={{height: 200, width: 280, backgroundColor: '#EEF1ED', borderRadius: 20, justifyContent: 'center', alignItems: 'center', padding: 5}}>
                                <TouchableOpacity activeOpacity={0.5} onPress={() => {setImage(null)}} style={{position: 'absolute', height: 20, width: 20, backgroundColor: 'white', borderRadius: 100, justifyContent: 'center', alignItems: 'center', zIndex: 100, top: 15, right: 15}}>
                                    <Ionicons name='close-circle' style={{fontSize: 20, left: 0.6, bottom: 0.6}} />
                                </TouchableOpacity>
                                <View style={{height: '100%', width: '100%'}}>
                                    <Image source={{uri: image.uri}} style={{flex: 1, resizeMode: 'cover', height: 1, borderRadius: 15}} />
                                </View>
                            </View>
                        </View>
                    }
                </View>
                <View style={styles.containerChkbx}>
                    <CheckBox
                        onPress={() => setAgree(!agree)}
                        title="I agree to the Terms and Conditions and Privacy Policy"
                        isChecked={agree}
                    />
                </View>
                <View style={styles.containerBtn}>
                    <View style={styles.button1}>
                        <TouchableOpacity style={{width: '100%', height: '100%'}} activeOpacity={0.5} onPress={() => { retrieveData() }}>
                            <Text style={styles.buttonTxt1}>
                                Create Account
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.button2}>
                        <TouchableOpacity style={{width: '100%', height: '100%'}} activeOpacity={0.5}>
                            <Text style={styles.buttonTxt2}>
                                Sign in with Google
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{flexDirection: 'row', gap: 5, alignItems: 'center', marginVertical: 10}}>
                        <Text style={{fontSize: 14, fontWeight: 500}}>Already have an account?</Text>
                        <TouchableOpacity activeOpacity={0.5} onPress={() => {clearForm(); navigation.navigate('login')}}>
                            <Text style={{color: 'rgb(0,123,0)', fontSize: 16, fontWeight: 900}}>Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
// Start Here
const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    containerBtn: {
        marginTop: 30,
        gap: 10,
        marginBottom: 30
    },
    containerFrm: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    containerChkbx: {
        flexDirection: "row",
        marginTop: 15,
        left: -12,
        width: 260,
    },
    title: {
        fontWeight: "900",
        fontSize: 30,
        bottom: 20,
        color: 'rgba(16, 139, 0, 1)',
    },
    input: {
        height: 40,
        width: 270,
        paddingVertical: 0,
        paddingLeft: 10,
        backgroundColor: 'rgb(189,227,124)',
        borderRadius: 10,
        marginVertical: 5,
        color: 'rgba(45, 105, 35, 1)',
    },
    button1: {
        width: 220,
        height: 45,
        backgroundColor: 'rgba(45, 105, 35, 1)',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgb(81,175,91)',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 3,
    },
    buttonTxt1: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgb(81,175,91)',
        textAlign: 'center',
        verticalAlign: 'middle',
        color: '#ffffff',
        fontWeight: '900',
    },
    button2: {
        width: 220,
        height: 45,
        backgroundColor: 'rgba(203, 203, 203, 1)',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgb(81,175,91)',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 3,
    },
    buttonTxt2: {
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        textAlign: 'center',
        verticalAlign: 'middle',
        color: 'rgb(81,175,91)',
        fontWeight: '900',
    },
});