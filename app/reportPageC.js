import * as React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parse } from 'date-fns';

import { db, auth, storage, firebase } from '../firebase_config';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

import SideBar from '../components/SideNav';

export default function ReportCol({ navigation }) {
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

    const [viewAllReports, setViewAllReports] = useState(false);
    const currentDate = new Date().toISOString().split('T')[0];
    const DateToday= getCurrentDate();

    function getCurrentDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const DateToday= new Date().toLocaleDateString(undefined, options);
        return DateToday;
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
        uploadCollection.map((post) => {
            if (post.status === 'collected') {
                return;
            }
            let imageURL;
            imageCol.map((url) => {
                if(url.includes(post.imageLink)) {
                    imageURL = url;
                }
            })

            temp.push(
                <View style={[styles.contentButton, styles.contentGap]}>
                    <TouchableOpacity activeOpacity={0.5}>
                        <View style={styles.contentButtonFront}>
                            <View style={{width: '93%', flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 10}}>
                                <View style={styles.containerPfp}>
                                    <Ionicons name='person-outline' style={styles.placeholderPfp} />
                                </View>
                                <Text style={{fontSize: 16, fontWeight: 800, color: 'rgba(113, 112, 108, 1)'}}>{users.map((user) => {if(post.userId === user.id) {return user.username;}})}</Text>
                            </View>
                            <SafeAreaView style={{width: '100%', marginVertical: 10, paddingHorizontal: 20}}>
                            <Text style={{ fontSize: 13 }}>
                                <Text style={{ fontWeight: 'bold' }}>Date Reported:</Text> {post.dateTime} </Text>
                            <Text style={{ fontSize: 13 }}>
                                <Text style={{ fontWeight: 'bold' }}>Location:</Text> {post.location} </Text>
                            <Text style={{ fontSize: 13 }}>
                                <Text style={{ fontWeight: 'bold' }}>Status of Report:</Text> {post.status} </Text>
                                <View style={{ width: '100%', height: 250, backgroundColor: '#D6D6D8', marginVertical: 5, justifyContent: 'center', alignItems: 'center' }}>
                                    <Image src={imageURL} style={{width: '100%', height: '100%', flex: 1, resizeMode: 'cover'}} />
                                </View>
                            </SafeAreaView>
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
        const [selectedReport, setSelectedReport] = useState(null);
        const currentDate = new Date().toISOString().split('T')[0];
    
        // Filter reports based on the current date
        const reportsToShow = viewAllReports
        ? userUploads.filter(report => report && report.dateTime && report.dateTime.includes(currentDate))
        : userUploads.filter(report => {
            const reportDate = parse(report.dateTime, 'yyyy/MM/dd hh:mm:ss a', new Date());
            const reportDateString = reportDate.toISOString().split('T')[0];
            return reportDateString === currentDate;
        });
    
        // Create a list of image components
        const imageList = viewAllReports && imageCol
        .filter(url => userUploads.some(report => {
          const reportDate = parse(report.dateTime, 'yyyy/MM/dd hh:mm:ss a', new Date());
          const reportDateString = reportDate.toISOString().split('T')[0];
    
          return report && report.dateTime && reportDateString === currentDate && url.includes(report.associatedImage);
        }))
        .map((url, index) => (
          <View key={index} style={{ width: 80, height: 80, backgroundColor: '#D6D6D8', marginVertical: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 10 }}>
            <Image source={{ uri: url }} style={{ width: '100%', height: '100%', flex: 1, resizeMode: 'cover', borderRadius: 10, borderColor: '#0D5601' }} />
          </View>
        ));
    
    
         // Create a list of report components for the current date
         const reportList = reportsToShow.map(uploads => (
            <TouchableOpacity key={uploads.id} activeOpacity={0.5} onPress={() => setSelectedReport(uploads)}>
                <View style={{ width: 315, backgroundColor: 'rgb(230, 230, 230)', borderRadius: 5, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 1, elevation: 5 }}>
                    <View style={{ width: '100%', backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', color: 'rgba(113, 112, 108, 1)' }}>
                        <SafeAreaView style={{ width: '100%', paddingHorizontal: 22, paddingBottom: 5, borderBottomWidth: 1, borderColor: 'rgba(190, 190, 190, 1)' }}>
                        <View style={{width: '93%', flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 15}}>
                                <View style={styles.containerPfp}>
                                    <Ionicons name='person-outline' style={styles.placeholderPfp} />
                                </View>
                                <Text style={{fontSize: 16, fontWeight: 500, color: 'rgba(113, 112, 108, 1)'}}>{users.map((user) => {if(uploads.userId === user.id) {return user.username;}})}</Text>
                            </View>
                            <Text style={{ fontSize: 12, marginTop: 10 }}>
                                <Text style={{ fontWeight: 'bold' }}>Date Reported:</Text> {uploads.dateTime} </Text>
                            <Text style={{ fontSize: 12 }}>
                                <Text style={{ fontWeight: 'bold' }}>Location</Text> {uploads.location} </Text>
                            <Text style={{ fontSize: 12 }}>
                                <Text style={{ fontWeight: 'bold' }}>Status of Report:</Text> {uploads.status} </Text>
                            <View style={{ width: '100%', height: 250, backgroundColor: 'white', marginVertical: 5, justifyContent: 'flex-start', alignItems: 'flex-start', borderRadius: 10 }}>
                                {imageCol && imageCol.length > 0 && (
                                    imageCol.find(url => url.includes(uploads.associatedImage)) && (
                                        <Image source={{ uri: imageCol.find(url => url.includes(uploads.associatedImage)) }} style={{ width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 10, justifyContent: 'flex-start' }} />
                                    )
                                )}
                            </View>
                        </SafeAreaView>
                    </View>
                </View>
            </TouchableOpacity>
        ));

        return (
            <View>
                <View style={{ flexDirection: 'row', marginHorizontal: 10, gap: 10 }}>
                    {/* Display the list of images */}
                    {imageList}
                </View>
                <View style={{ flexDirection: 'row', marginHorizontal: 10, gap: 10 }}>
                    {/* Display the list of reports for the current date */}
                    {reportList}
                </View>
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
              <TouchableOpacity style={{ position: 'absolute', right: 20, top: 31, zIndex: 99 }} onPress={() => {navigation.navigate('notification')}}>
                  <Ionicons name='notifications' style={{ fontSize: 35, color: 'rgb(81,175,91)' }} />
              </TouchableOpacity>
                <SafeAreaView style={styles.container}>
                    <View style={{width: '100%', flexDirection: 'row', justifyContent: 'center', paddingTop: 14}}>
                        <Text style={{ fontSize: 25, fontWeight: 900, color: 'rgb(81,175,91)' }}>REPORTS</Text>
                    </View>
                    <Text style={{position: 'absolute', right: 20, top: 80}}>
                    <Text style={{ fontWeight: 600 }}> {DateToday}</Text>
                    </Text>
                    <View>
                    <View style={{width: 330, backgroundColor: 'rgb(231, 247, 233)', borderRadius: 10,  overflow: 'hidden', marginBottom: 5,
                     marginTop: 50, shadowColor: '#0D5601', shadowOffset: { width: 0, height: 2,}, shadowOpacity: 0.8, shadowRadius: 3, elevation: 5 }}>
                                <View style={{ flexDirection: 'row', width: '100%' }}>
                                    <Text style={{ left: 10, marginTop: 15, fontWeight: 700 }}>REPORTS TODAY</Text>
                                    <TouchableOpacity
                                        activeOpacity={0.5}
                                        style={{ position: 'absolute', right: 15, marginTop: 15 }}
                                        onPress={() => setViewAllReports(!viewAllReports)}
                                    >
                                        <Text style={{ textDecorationLine: 'underline' }}>
                                            View Details
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView horizontal={true}>
                                <ViewAllContent viewAllReports={viewAllReports} currentDate={currentDate} />
                            </ScrollView>
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
        shadowColor: "rgb(0,0,0)",
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
        backgroundColor: 'rgb(231, 247, 233)',
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