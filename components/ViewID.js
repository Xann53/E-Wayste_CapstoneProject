import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Image, Modal } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db, auth, storage, firebase } from "../firebase_config";
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, listAll, getDownloadURL,  uploadBytes} from 'firebase/storage';

export default function DisplayWorkID({ imageLink, setImageFunction }) {
    const [images, setImages] = useState([]);
    const [imageURI, setImageURI] = useState();

    const imageIDRef = ref(storage, "userWorkID/");

    useEffect(() => {
        listAll(imageIDRef).then((response) => {
            setImages([]);
            response.items.forEach((item) => {
                getDownloadURL(item).then((url) => {
                    setImages((prev) => [...prev, url])
                })
            })
        })
    }, []);

    function DisplayImage() {
        useEffect(() => {
            const uri = images.find((link) => link.includes(imageLink));
            setImageURI(uri);
        }, []);

        return (
            <>
                <Image source={{ uri: imageURI }} style={{ display: 'flex', flex: 1, width: '100%', resizeMode: 'contain', zIndex: 40, transform: [{translateY: -50}] }} />
            </>
        );
    }
    
    return (
        <>
            <Modal animationType='slide' transparent={true} statusBarTranslucent={true}>
                <View style={{position: 'absolute', display: 'flex', flex: 1, width: '100%', height: '100%', padding: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(30,30,30,0.9)', zIndex: 50}}>
                    <View style={{width: '100%', alignItems: 'flex-end', paddingTop: 25, paddingRight: 10, zIndex: 55}}>
                        <TouchableOpacity onPress={() => {setImageFunction()}}>
                            <View style={{padding: 1, paddingHorizontal: 2, backgroundColor: '#E8A319', borderRadius: 5}}>
                                <Ionicons name="close" style={{fontSize: 30, color: 'white'}} />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <DisplayImage />
                </View>
            </Modal>
            
        </>
    );
}