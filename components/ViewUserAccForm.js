import React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, Image, Modal } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db, auth, storage, firebase } from "../firebase_config";
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, listAll, getDownloadURL,  uploadBytes} from 'firebase/storage';

export default function DisplayUserAcc({ accID, setViewAccFunction, setImageFunction }) {
    const [lguCode, setLguCode] = useState();
    const [users, setUsers] = useState([]);
    const [images, setImages] = useState([]);
    const [imageURI, setImageURI] = useState();

    const userRef = firebase.firestore().collection("users");
    const pendingUserRef = firebase.firestore().collection("pendingUsers");
    const imageIDRef = ref(storage, "userWorkID/");

    useEffect(() => {
        const getUserData = async() => {
            const code = await AsyncStorage.getItem('userLguCode');
            setLguCode(code);
        }
        getUserData()
    }, []);

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

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setUsers((prev) => [...prev, ...newData]);

        };

        const unsubscribe = pendingUserRef.onSnapshot(onSnapshot);

        return () => {
            unsubscribe();
        };
    }, []);

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
    
    function AccForm() {
        users.map((user) => {
            if(user.id === accID) {
                try {
                    const uri = images.find((link) => link.includes(user.associatedImage));
                    setImageURI(uri);
                } catch(e) {}
            }
        });
        
        let temp = []
        users.map((user) => {
            if(user.id === accID) {
                temp.push(
                    <View style={{display: 'flex', width: '100%', gap: 10}}>

                        <View style={{display: 'flex', width: '100%', flexDirection: 'row', gap: 10}}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'flex-end'}}>
                                <Text style={{fontSize: 15, fontWeight: 600}}>First Name:</Text>
                            </View>
                            <View style={{flex: 2, justifyContent: 'center'}}>
                                <TextInput
                                    value={user.firstName}
                                    editable={false}
                                    style={{borderRadius: 5, fontSize: 15, fontWeight: '700', width: '100%', padding: 5, paddingHorizontal: 15, backgroundColor: 'rgb(189,227,124)', color: 'black'}}
                                />
                            </View>
                        </View>

                        <View style={{display: 'flex', width: '100%', flexDirection: 'row', gap: 10}}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'flex-end'}}>
                                <Text style={{fontSize: 15, fontWeight: 600}}>Last Name:</Text>
                            </View>
                            <View style={{flex: 2, justifyContent: 'center'}}>
                                <TextInput
                                    value={user.lastName}
                                    editable={false}
                                    style={{borderRadius: 5, fontSize: 15, fontWeight: '700', width: '100%', padding: 5, paddingHorizontal: 15, backgroundColor: 'rgb(189,227,124)', color: 'black'}}
                                />
                            </View>
                        </View>

                        <View style={{display: 'flex', width: '100%', flexDirection: 'row', gap: 10}}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'flex-end'}}>
                                <Text style={{fontSize: 15, fontWeight: 600}}>Contact No:</Text>
                            </View>
                            <View style={{flex: 2, justifyContent: 'center'}}>
                                <TextInput
                                    value={user.contactNo}
                                    editable={false}
                                    style={{borderRadius: 5, fontSize: 15, fontWeight: '700', width: '100%', padding: 5, paddingHorizontal: 15, backgroundColor: 'rgb(189,227,124)', color: 'black'}}
                                />
                            </View>
                        </View>

                        <View style={{display: 'flex', width: '100%', flexDirection: 'row', gap: 10}}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'flex-end'}}>
                                <Text style={{fontSize: 15, fontWeight: 600}}>Email:</Text>
                            </View>
                            <View style={{flex: 2, justifyContent: 'center'}}>
                                <TextInput
                                    value={user.email}
                                    editable={false}
                                    style={{borderRadius: 5, fontSize: 15, fontWeight: '700', width: '100%', padding: 5, paddingHorizontal: 15, backgroundColor: 'rgb(189,227,124)', color: 'black'}}
                                />
                            </View>
                        </View>

                        <Text>ID Picture</Text>

                        <TouchableOpacity activeOpacity={0.7} onPress={() => {setImageFunction(user.associatedImage)}}>
                            <View style={{width: '100%', height: 250, backgroundColor: '#D3D3D3', borderRadius: 20, borderWidth: 1, overflow: 'hidden'}}>
                                {imageURI ?
                                    <Image source={{ uri: imageURI }} style={{ display: 'flex', flex: 1, width: '100%', resizeMode: 'contain', zIndex: 40 }} />
                                    :
                                    <></>
                                }
                            </View>
                        </TouchableOpacity>

                    </View>
                );
            }
        });

        <ul>
            {temp.map(item => (
                <li key={item}>{item}</li>
            ))}
        </ul>

        return(
            <>
                <View style={{display: 'flex', width: '100%'}}>
                    {temp}
                </View>
            </>
        );
    }

    return (
        <>
            <Modal animationType='fade' transparent={true} statusBarTranslucent={true}>
                <View style={{position: 'absolute', display: 'flex', flex: 1, width: '100%', height: '100%', padding: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 5}}>
                    <Text style={{fontSize: 25, fontWeight: 900, color: 'green', marginTop: -100, zIndex: 25, transform:[{translateY: 39}]}}>USER INFORMATION</Text>
                    <View style={{display: 'flex', width: '100%', padding: 10, backgroundColor: 'white', borderRadius: 10, zIndex: 20}}>
                        <View style={{width: '100%', alignItems: 'flex-end', marginBottom: 20}}>
                            <TouchableOpacity onPress={() => {setViewAccFunction()}} style={{zIndex: 15}}>
                                <View style={{padding: 1, paddingHorizontal: 2, backgroundColor: '#E8A319', borderRadius: 5}}>
                                    <Ionicons name="close" style={{fontSize: 20, color: 'white'}} />
                                </View>
                            </TouchableOpacity>
                        </View>
                        <AccForm />
                    </View>
                    <TouchableOpacity onPress={() => {setViewAccFunction()}} style={{position: 'absolute', display: 'flex', flex: 1, width: '100%', height: '100%', zIndex: 10}} />
                </View>
            </Modal>
            
        </>
    );
}