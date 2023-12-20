import * as React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from 'moment/moment';

import { db, auth, storage, firebase } from '../../firebase_config';
import { collection, addDoc, getDocs, query, updateDoc, doc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

import { db, auth, storage, firebase } from '../../firebase_config';
import SideBar from '../../components/SideNav';

export default function Notifications({ navigation }) {
    const [refreshing, setRefreshing] = React.useState(false);
    const [openSideBar, setOpenSideBar] = React.useState();

    const [users, setUsers] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [reports, setReports] = useState([]);
    
    const userRef = firebase.firestore().collection("users");
    const schedRef = firebase.firestore().collection("schedule");
    const reportRef = firebase.firestore().collection("generalUsersReports");
    const postRef = firebase.firestore().collection("posts");
    const likeRef = firebase.firestore().collection("likes");
    const commentRef = firebase.firestore().collection("comments");
    
    let notifCollection = [];

    const[currentUser, setCurrentUser] = useState();
    const[currentId, setCurrentId] = useState();

    const isFocused = useIsFocused();
    useEffect(() => {
        if(!isFocused) {
            setOpenSideBar();
        }
    });
    
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

    useEffect(() => {
        userRef.onSnapshot(
            userSnap => {
                const userData = [];
                userSnap.forEach((user) => {
                    const {accountType, associatedImage, barangay, contactNo, email, firstName, lastName, municipality, province, username} = user.data();
                    userData.push({
                        id: user.id,
                        accountType,
                        associatedImage,
                        barangay,
                        contactNo,
                        email,
                        firstName,
                        lastName,
                        municipality,
                        province,
                        username
                    })
                })
                setUsers(userData);
            }
        )

        schedRef.onSnapshot(
            schedSnap => {
                const schedData = [];
                schedSnap.forEach((sched) => {
                    const {assignCollector, collectionRoute, description, latitude, location, longitude, scheduleID, selectedDate, startTime, title, type, userID, dateTimeUploaded} = sched.data();
                    schedData.push({
                        id: sched.id,
                        assignCollector,
                        collectionRoute,
                        description,
                        latitude,
                        location,
                        longitude,
                        scheduleID,
                        selectedDate,
                        startTime,
                        title,
                        type,
                        userID,
                        dateTimeUploaded
                    })
                })
                setSchedules(schedData);
            }
        )

        reportRef.onSnapshot(
            reportSnap => {
                const reportData = [];
                reportSnap.forEach((report) => {
                    const {associatedImage, dateTime, description, latitude, location, longitude, status, userId} = report.data();
                    reportData.push({
                        id: report.id,
                        associatedImage,
                        dateTime,
                        description,
                        latitude,
                        location,
                        longitude,
                        status,
                        userId
                    })
                })
                setReports(reportData);
            }
        )

        const getCurrentUser = async() => {
            let username = await AsyncStorage.getItem('userUName');
            let id = await AsyncStorage.getItem('userId')
            setCurrentUser(username);
            setCurrentId(id);
        };
        getCurrentUser();
    }, [])

    function displayNotif(displayNotifType) {
        const currentDate = moment().utcOffset('+08').format('YYYY-MM-DD');
        reports.map((report) => {
            var valueToPush = { };
            valueToPush["notifType"] = "Report";
            valueToPush["id"] = report.id;
            valueToPush["associatedImage"] = report.associatedImage;
            valueToPush["dateTimeUploaded"] = report.dateTime;
            valueToPush["description"] = report.description;
            valueToPush["location"] = report.location;
            valueToPush["status"] = report.status;
            valueToPush["userID"] = report.userId;
            notifCollection.push(valueToPush);
            notifCollection.sort((a, b) => {
                let fa = a.dateTimeUploaded, fb = b.dateTimeUploaded;
                if (fa > fb) {return -1;}
                if (fa < fb) {return 1;}
                return 0;
            });
        })
        schedules.map((sched) => {
            var valueToPush = { };
            valueToPush["notifType"] = "Schedule";
            valueToPush["id"] = sched.id;
            valueToPush["assignCollector"] = sched.assignCollector;
            valueToPush["collectionRoute"] = sched.collectionRoute;
            valueToPush["description"] = sched.description;
            valueToPush["latitude"] = sched.latitude;
            valueToPush["location"] = sched.location;
            valueToPush["longitude"] = sched.longitude;
            valueToPush["scheduleID"] = sched.scheduleID;
            valueToPush["selectedDate"] = sched.selectedDate;
            valueToPush["startTime"] = sched.startTime;
            valueToPush["title"] = sched.title;
            valueToPush["type"] = sched.type;
            valueToPush["userID"] = sched.userID;
            valueToPush["dateTimeUploaded"] = sched.dateTimeUploaded;
            notifCollection.push(valueToPush);
            notifCollection.sort((a, b) => {
                let fa = a.dateTimeUploaded, fb = b.dateTimeUploaded;
                if (fa > fb) {return -1;}
                if (fa < fb) {return 1;}
                return 0;
            });
        })
        try {
            const temp = [];
            notifCollection.map((notif) => {
                let username;
                notifCollection = [];
                users.map((user) => {
                    if(user.id == notif.userID) {
                        username = user.username;
                    }
                })
                
                if (currentDate === notif.selectedDate && displayNotifType === 'Reminder') {
                    if(notif.notifType === 'Schedule' && notif.type === 'Collection') {
                        temp.push(
                            <View style={{ display: 'flex', flex: 1, width: '100%', height: 90, backgroundColor: 'rgb(231, 247, 233)', borderRadius: 15, overflow: 'hidden', flexDirection: 'row' }}>
                                <View style={{ height: '100%', width: 70, backgroundColor: 'rgb(189,228,124)', justifyContent: 'center', alignItems: 'center' }}>
                                    <View style={{width: 50, height: 50, borderRadius: 100, backgroundColor: 'rgb(81,175,91)', justifyContent: 'center', alignItems: 'center'}}>
                                        <Ionicons name='trash' style={{ fontSize: 35, color: 'rgb(13,86,1)' }} />
                                    </View>
                                </View>
                                <View style={{display: 'flex', flex: 1, marginLeft: 10, marginTop: 7}}>
                                    <View style={{width: '90%'}}>
                                        <Text style={{fontSize: 16, fontWeight: 900, color: 'rgb(13,86,1)'}}>{notif.type}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 11, fontWeight: 600, marginTop: -1}}>Garbage Collection scheduled by {username}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 11, marginTop: 5}}>{notif.description}</Text>
                                        <Text style={{fontSize: 12, fontWeight: 700}}>Start Time: {notif.startTime}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    } else if(notif.notifType === 'Schedule' && notif.type === 'Event') {
                        temp.push(
                            <View style={{ display: 'flex', flex: 1, width: '100%', height: 90, backgroundColor: 'rgb(231, 247, 233)', borderRadius: 15, overflow: 'hidden', flexDirection: 'row' }}>
                                <View style={{ height: '100%', width: 70, backgroundColor: 'rgb(189,228,124)', justifyContent: 'center', alignItems: 'center' }}>
                                    <View style={{width: 50, height: 50, borderRadius: 100, backgroundColor: 'rgb(81,175,91)', justifyContent: 'center', alignItems: 'center'}}>
                                        <Ionicons name='people' style={{ fontSize: 35, color: 'rgb(13,86,1)' }} />
                                    </View>
                                </View>
                                <View style={{display: 'flex', flex: 1, marginLeft: 10, marginTop: 7}}>
                                    <View style={{width: '90%'}}>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 16, fontWeight: 900, color: 'rgb(13,86,1)'}}>{notif.title} {notif.type}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 11, fontWeight: 600, marginTop: -1}}>Event scheduled by {username}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 11, marginTop: 5}}>{notif.description}</Text>
                                        <Text style={{fontSize: 12, fontWeight: 700}}>Start Time: {notif.startTime}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    }
                    if(notif.notifType === 'Schedule' && notif.type === 'Assignment') {
                        users.map((user) => {
                            if(user.username.toLowerCase() === notif.assignCollector.toLowerCase() && (user.username.toLowerCase() === currentUser.toLowerCase() || notif.userID === currentId)) {
                                temp.push(
                                    <View style={{ display: 'flex', flex: 1, width: '100%', height: 90, backgroundColor: 'rgb(231, 247, 233)', borderRadius: 15, overflow: 'hidden', flexDirection: 'row' }}>
                                        <View style={{ height: '100%', width: 70, backgroundColor: 'rgb(189,228,124)', justifyContent: 'center', alignItems: 'center' }}>
                                            <View style={{width: 50, height: 50, borderRadius: 100, backgroundColor: 'rgb(81,175,91)', justifyContent: 'center', alignItems: 'center'}}>
                                                <Ionicons name='person' style={{ fontSize: 35, color: 'rgb(13,86,1)' }} />
                                            </View>
                                        </View>
                                        <View style={{display: 'flex', flex: 1, marginLeft: 10, marginTop: 7}}>
                                            <View style={{width: '90%'}}>
                                                <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 16, fontWeight: 900, color: 'rgb(13,86,1)'}}>{notif.type}</Text>
                                                <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 11, fontWeight: 600, marginTop: -1}}>Assignment for {user.username} by {username}</Text>
                                                <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 11, marginTop: 5}}>{notif.description}</Text>
                                                <Text style={{fontSize: 12, fontWeight: 700}}>Start Time: {notif.startTime}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            }
                        })
                    }
                }

                if (displayNotifType === 'All') {
                    if(notif.notifType === 'Report') {
                        temp.push(
                            <View style={{ display: 'flex', flex: 1, width: '100%', height: 90, backgroundColor: 'rgb(231, 247, 233)', borderRadius: 15, overflow: 'hidden', flexDirection: 'row' }}>
                                <View style={{ height: '100%', width: 70, backgroundColor: 'rgb(189,228,124)', justifyContent: 'center', alignItems: 'center' }}>
                                    <View style={{width: 50, height: 50, borderRadius: 100, backgroundColor: 'rgb(81,175,91)', justifyContent: 'center', alignItems: 'center'}}>
                                        <Ionicons name='file-tray-full' style={{ fontSize: 35, color: 'rgb(13,86,1)' }} />
                                    </View>
                                </View>
                                <View style={{display: 'flex', flex: 1, marginLeft: 10, marginTop: 7}}>
                                    <View style={{width: '90%'}}>
                                        <Text style={{fontSize: 16, fontWeight: 900, color: 'rgb(13,86,1)'}}>{notif.notifType}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 11, fontWeight: 600, marginTop: -1}}>Garbage Report by {username}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 11, marginTop: 5}}>{notif.description}</Text>
                                        <Text style={{fontSize: 9}}>{notif.dateTimeUploaded}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    } else if(notif.notifType === 'Schedule' && notif.type === 'Collection') {
                        temp.push(
                            <View style={{ display: 'flex', flex: 1, width: '100%', height: 90, backgroundColor: 'rgb(231, 247, 233)', borderRadius: 15, overflow: 'hidden', flexDirection: 'row' }}>
                                <View style={{ height: '100%', width: 70, backgroundColor: 'rgb(189,228,124)', justifyContent: 'center', alignItems: 'center' }}>
                                    <View style={{width: 50, height: 50, borderRadius: 100, backgroundColor: 'rgb(81,175,91)', justifyContent: 'center', alignItems: 'center'}}>
                                        <Ionicons name='trash' style={{ fontSize: 35, color: 'rgb(13,86,1)' }} />
                                    </View>
                                </View>
                                <View style={{display: 'flex', flex: 1, marginLeft: 10, marginTop: 7}}>
                                    <View style={{width: '90%'}}>
                                        <Text style={{fontSize: 16, fontWeight: 900, color: 'rgb(13,86,1)'}}>{notif.type}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 11, fontWeight: 600, marginTop: -1}}>Garbage Collection scheduled by {username}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 11, marginTop: 5}}>{notif.description}</Text>
                                        <Text style={{fontSize: 9}}>{notif.dateTimeUploaded}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    } else if(notif.notifType === 'Schedule' && notif.type === 'Event') {
                        temp.push(
                            <View style={{ display: 'flex', flex: 1, width: '100%', height: 90, backgroundColor: 'rgb(231, 247, 233)', borderRadius: 15, overflow: 'hidden', flexDirection: 'row' }}>
                                <View style={{ height: '100%', width: 70, backgroundColor: 'rgb(189,228,124)', justifyContent: 'center', alignItems: 'center' }}>
                                    <View style={{width: 50, height: 50, borderRadius: 100, backgroundColor: 'rgb(81,175,91)', justifyContent: 'center', alignItems: 'center'}}>
                                        <Ionicons name='people' style={{ fontSize: 35, color: 'rgb(13,86,1)' }} />
                                    </View>
                                </View>
                                <View style={{display: 'flex', flex: 1, marginLeft: 10, marginTop: 7}}>
                                    <View style={{width: '90%'}}>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 16, fontWeight: 900, color: 'rgb(13,86,1)'}}>{notif.title} {notif.type}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 11, fontWeight: 600, marginTop: -1}}>Event scheduled by {username}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 11, marginTop: 5}}>{notif.description}</Text>
                                        <Text style={{fontSize: 9}}>{notif.dateTimeUploaded}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    }
                    if(notif.notifType === 'Schedule' && notif.type === 'Assignment') {
                        users.map((user) => {
                            if(user.username.toLowerCase() === notif.assignCollector.toLowerCase() && (user.username.toLowerCase() === currentUser.toLowerCase() || notif.userID === currentId)) {
                                temp.push(
                                    <View style={{ display: 'flex', flex: 1, width: '100%', height: 90, backgroundColor: 'rgb(231, 247, 233)', borderRadius: 15, overflow: 'hidden', flexDirection: 'row' }}>
                                        <View style={{ height: '100%', width: 70, backgroundColor: 'rgb(189,228,124)', justifyContent: 'center', alignItems: 'center' }}>
                                            <View style={{width: 50, height: 50, borderRadius: 100, backgroundColor: 'rgb(81,175,91)', justifyContent: 'center', alignItems: 'center'}}>
                                                <Ionicons name='person' style={{ fontSize: 35, color: 'rgb(13,86,1)' }} />
                                            </View>
                                        </View>
                                        <View style={{display: 'flex', flex: 1, marginLeft: 10, marginTop: 7}}>
                                            <View style={{width: '90%'}}>
                                                <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 16, fontWeight: 900, color: 'rgb(13,86,1)'}}>{notif.type}</Text>
                                                <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 11, fontWeight: 600, marginTop: -1}}>Assignment for {user.username} by {username}</Text>
                                                <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 11, marginTop: 5}}>{notif.description}</Text>
                                                <Text style={{fontSize: 9}}>{notif.dateTimeUploaded}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            }
                        })
                    }
                }
            });

            <ul>
                {temp.map(item =>
                    <li key="{item}">{item}</li>
                )}
            </ul>

            return (
                <View style={{gap: 15, marginBottom: 20}}>
                    {temp}
                </View>
            );
        } catch(e) {}
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
                    <View style={{width: '100%', flexDirection: 'row', justifyContent: 'center', paddingTop: 14}}>
                        <Text style={{ fontSize: 25, fontWeight: 900, color: 'rgb(81,175,91)' }}>NOTIFICATIONS</Text>
                    </View>
                    <View style={{ marginTop: 50, width: 330 }}>
                        <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
                            <Text style={{ fontSize: 20, fontWeight: 700, color: 'rgb(13,86,1)', marginBottom: 5 }}>Reminder Today</Text>
                            <Text>
                                <Text style={{fontWeight: 600}}>{moment().utcOffset('+08').format('dddd')}</Text>, {moment().utcOffset('+08').format('MM/DD/YYYY')}
                            </Text>
                        </View>
                        {displayNotif('Reminder')}
                        <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
                            <Text style={{ fontSize: 20, fontWeight: 700, color: 'rgb(13,86,1)', marginBottom: 5 }}>Notification History</Text>
                        </View>
                        {displayNotif('All')}
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
        paddingBottom: 20,
        paddingTop: 20,
    },
});