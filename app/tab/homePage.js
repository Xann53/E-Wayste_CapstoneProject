import * as React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db, auth, storage, firebase } from '../../firebase_config';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

import SideBar from '../../components/SideNav';

export default function Newsfeed({ navigation }) {
    const isFocused = useIsFocused();
    const [refreshing, setRefreshing] = React.useState(false);
    const [openSideBar, setOpenSideBar] = React.useState();
    const [users, setUsers] = useState([]);
    const [userUploads, setUserUploads] = useState([]);
    const [imageCol, setImageCol] = useState([]);
    let uploadCollection = [];

    const usersCollection = collection(db, "users");
    const reportRef = firebase.firestore().collection("generalUsersReports");
    const imageColRef = ref(storage, "postImages/");

    const currentDate = getCurrentDate();

    const [isPressed, setIsPressed] = useState(false);

    const handlePress = () => {
      setIsPressed(!isPressed);
    };

    function getCurrentDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const currentDate = new Date().toLocaleDateString(undefined, options);
      
        return currentDate;
      }


    useEffect(() => {
        if(!isFocused) {
            setOpenSideBar();
        }
    });

    useEffect(() => {
        const getUsers = async () => {
            const data = await getDocs(usersCollection);
            setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
        };
        getUsers();

        reportRef.onSnapshot(
            querySnapshot => {
                const uploads = []
                querySnapshot.forEach((doc) => {
                    const {associatedImage, dateTime, description, location, status, userId} = doc.data();
                    uploads.push({
                        id: doc.id,
                        associatedImage,
                        dateTime,
                        description,
                        location,
                        status,
                        userId
                    })
                })
                setUserUploads(uploads)
                
                listAll(imageColRef).then((response) => {
                    setImageCol([]);
                    response.items.forEach((item) => {
                        getDownloadURL(item).then((url) => {
                            setImageCol((prev) => [...prev, url])
                        })
                    })
                })
            }
        )
    }, [])
    
    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    function SideNavigation(navigation) {
        return (
            <>
                <View style={{position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99}}>
                    <TouchableOpacity style={{ position: 'absolute', left: 20, top: 30, zIndex: 150 }} onPress={() => {setOpenSideBar()}}>
                        <Ionicons name='arrow-back' style={{ fontSize: 40, color: 'rgb(81,175,91)' }} />
                    </TouchableOpacity>
                    {SideBar(navigation)}
                    <TouchableOpacity style={{position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0)', zIndex: -1}} onPress={() => {setOpenSideBar()}} />
                </View>
            </>
        );
    }

    function BodyContent() {
        userUploads.map((uploads) => {
            var valueToPush = { };
            valueToPush["id"] = uploads.id;
            valueToPush["imageLink"] = uploads.associatedImage;
            valueToPush["dateTime"] = uploads.dateTime;
            valueToPush["description"] = uploads.description;
            valueToPush["location"] = uploads.location;
            valueToPush["status"] = uploads.status;
            valueToPush["userId"] = uploads.userId;
            uploadCollection.push(valueToPush);
            uploadCollection.sort((a, b) => {
                let fa = a.dateTime, fb = b.dateTime;
                if (fa < fb) {return -1;}
                if (fa > fb) {return 1;}
                return 0;
            });
        })

        let temp = [];
        uploadCollection.map((post,index) => {
            let imageURL;
            imageCol.map((url) => {
                if(url.includes(post.imageLink)) {
                    imageURL = url;
                }
            })

            temp.push(
                <View style={[styles.contentButton, styles.contentGap]} key={post.id}>
                    <TouchableOpacity activeOpacity={0.5}>
                        <View style={styles.contentButtonFront}>
                            <View style={{width: '93%', flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 15}}>
                                <View style={styles.containerPfp}>
                                    <Ionicons name='person-outline' style={styles.placeholderPfp} />
                                </View>
                                <Text style={{fontSize: 16, fontWeight: 500, color: 'rgba(113, 112, 108, 1)'}}>{users.map((user) => {if(post.userId === user.id) {return user.username;}})}</Text>
                            </View>
                            <SafeAreaView style={{width: '100%', marginVertical: 10, paddingHorizontal: 22, paddingBottom: 5, borderBottomWidth: 1, borderColor: 'rgba(190, 190, 190, 1)'}}>
                                <Text style={{fontSize: 13, marginBottom: 5,}}>{post.description}</Text>
                                <View style={{ width: '100%', height: 250, backgroundColor: '#D6D6D8', marginVertical: 5, justifyContent: 'center', alignItems: 'center' }}>
                                    {/* <Ionicons name='images-outline' style={{fontSize: 100, color: 'white'}} /> */}
                                    <Image src={imageURL} style={{width: '100%', height: '100%', flex: 1, resizeMode: 'cover'}} />
                                </View>
                            </SafeAreaView>
                             <View style={{width: '90%', flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10}}>
                                <TouchableOpacity activeOpacity={0.5} onPress={handlePress}>
                                <Ionicons
                                    name={isPressed ? 'heart' : 'heart-outline'}
                                    style={{ fontSize: 25, color: isPressed? 'green' : 'black' }}
                                />
                                </TouchableOpacity>
                                <TouchableOpacity activeOpacity={0.5}>
                                <Ionicons name='chatbubble-outline' style={{ fontSize: 25 }} />
                                </TouchableOpacity>
                                <TouchableOpacity activeOpacity={0.5}>
                                <Ionicons name='share-outline' style={{ fontSize: 25 }} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            );
        });
        
        <ul>
            {temp.map(item =>
                <li key="{item}">{item}</li>
            )}
        </ul>

        return (
            <View>
                {temp}
            </View>
        );
    }

    function ViewAllContent() {
        let temp1 = [];
        imageCol.map((url) => {
            temp1.push(
                <TouchableOpacity activeOpacity={0.5}>
                    <View style={{ width: 80, height: 80, backgroundColor: '#D6D6D8', marginVertical: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 10 }}>
                        {/* <Ionicons name='images-outline' style={{fontSize: 40, color: 'white'}} /> */}
                        <Image src={url} style={{width: '100%', height: '100%', flex: 1, resizeMode: 'cover'}} />
                    </View>
                </TouchableOpacity>
            );
        });
        
        <ul>
            {temp1.map(item =>
                <li key="{item}">{item}</li>
            )}
        </ul>

        return (
            <View style={{flexDirection: 'row', marginHorizontal: 10, gap: 10}}>
                {temp1}
            </View>
        );
    }

    return (
        <>
            {openSideBar}
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
                <TouchableOpacity style={{ position: 'absolute', left: 20, top: 30, zIndex: 99 }} onPress={() => {setOpenSideBar(SideNavigation(navigation))}}>
                    <Ionicons name='menu' style={{ fontSize: 40, color: 'rgb(81,175,91)' }} />
                </TouchableOpacity>
                <SafeAreaView style={styles.container}>
                    <View style={{width: '100%', flexDirection: 'row', top: 11 , justifyContent: 'center', paddingTop: 14}}>
                        <Text style={{ fontSize: 25, fontWeight: 900, color: 'rgb(81,175,91)' }}>DASHBOARD</Text>
                    </View>
                    <Text style={{ position: 'absolute', right: 20, top: 90 }}>
                  <Text style={{ fontWeight: 600 }}> {currentDate}</Text>
                </Text>
                    <View style={{width: 330, backgroundColor: 'rgb(231, 247, 233)', borderRadius: 10, overflow: 'hidden', marginBottom: 5, marginTop: 50}}>
                        <View style={{ flexDirection: 'row', width: '100%' }}>
                            <Text style={{ left: 10, marginTop: 15, fontWeight: 700 }}>REPORTS TODAY</Text>
                            <TouchableOpacity activeOpacity={0.5} style={{ position: 'absolute', right: 15, marginTop: 15 }}>
                                <Text style={{textDecorationLine: 'underline'}}>
                                    View all
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal={true}>
                            {ViewAllContent()}
                        </ScrollView>
                    </View>
                    <View>
                        <View style={{width: '100%', flexDirection: 'row', justifyContent: 'flex-start'}}>
                            <Text style={{ fontSize: 20, fontWeight: 900, color: 'rgb(81,175,91)' }}>NEWSFEED</Text>
                        </View>
                        <View style={{width: 330, backgroundColor: 'rgb(230, 230, 230)', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgb(16, 139, 0)', marginBottom: 20}}>
                            <TouchableOpacity activeOpacity={0.5}>
                                <View style={{backgroundColor: '#ffffff', flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, alignItems: 'center'}}>
                                    <View style={[styles.containerPfp, {width: 40, height: 40}]}>
                                        <Ionicons name='person-outline' style={[styles.placeholderPfp, {fontSize: 25}]} />
                                    </View>
                                    <Text style={{left: 15}}>
                                        What's on your mind?
                                    </Text>
                                    <View style={{position: 'absolute', right:15, width: 70, height: 35, backgroundColor: 'rgb(45, 105, 35)', borderRadius: 20, overflow: 'hidden'}}>
                                        <TouchableOpacity activeOpacity={0.5}>
                                            <View style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(81,175,91)'}}>
                                                <Text style={{fontWeight: 700, color: '#ffffff'}}>POST</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={{paddingHorizontal: 10, flexDirection: 'row', gap: 10, marginBottom: 15}}>
                            <View style={{width: 70, height: 35, backgroundColor: 'rgb(179, 229, 94)', borderRadius: 20, overflow: 'hidden', shadowColor: "#000", shadowOffset: {width: 0, height: 3,}, shadowOpacity: 0.27, elevation: 3}}>
                                <TouchableOpacity activeOpacity={0.5}>
                                    <View style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(247, 245, 243)'}}>
                                        <Text style={{fontWeight: 700, fontSize: 15, color: 'rgb(113, 112, 108)'}}>All</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={{width: 90, height: 35, backgroundColor: 'rgb(179, 229, 94)', borderRadius: 20, overflow: 'hidden', shadowColor: "#000", shadowOffset: {width: 0, height: 3,}, shadowOpacity: 0.27, elevation: 3}}>
                                <TouchableOpacity activeOpacity={0.5}>
                                    <View style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(247, 245, 243)'}}>
                                        <Text style={{fontWeight: 700, fontSize: 15, color: 'rgb(113, 112, 108)'}}>Reports</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={{width: 90, height: 35, backgroundColor: 'rgb(179, 229, 94)', borderRadius: 20, overflow: 'hidden', shadowColor: "#000", shadowOffset: {width: 0, height: 3,}, shadowOpacity: 0.27, elevation: 3}}>
                                <TouchableOpacity activeOpacity={0.5}>
                                    <View style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(247, 245, 243)'}}>
                                        <Text style={{fontWeight: 700, fontSize: 15, color: 'rgb(113, 112, 108)'}}>Events</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {BodyContent ()}
                    </View>
                </SafeAreaView>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingBottom: 60,
        paddingTop: 20,
    },
    contentGap: {
        marginBottom: 10,
    },
    contentButton: {
        width: 330,
        backgroundColor: 'rgb(230, 230, 230)',
        borderRadius: 5,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 3,
            height: 3,
        },
        shadowOpacity: 1,
        shadowRadius: 1,
        elevation: 5,
    },
    contentButtonFront: {
        width: '100%',
        backgroundColor: 'rgb(247, 245, 243)',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'rgba(113, 112, 108, 1)',
    },
    containerPfp: {
        width: 35,
        height: 35,
        backgroundColor: '#D6D6D8',
        borderRadius: 55,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderPfp: {
        fontSize: 25,
        color: 'rgba(113, 112, 108, 1)',
    },
});