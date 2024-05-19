
import * as React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from 'moment/moment';
import Icon from 'react-native-vector-icons/FontAwesome';

import { db, auth, storage, firebase } from '../firebase_config';
import { collection, addDoc, getDocs, query, updateDoc, doc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import SideBar from '../components/SideNav';
import OpenSideBar from '../components/OpenSideNav';


export default function Notifications({ navigation }) {
    const [refreshing, setRefreshing] = React.useState(false);
    const [openSideBar, setOpenSideBar] = React.useState();
    const [users, setUsers] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [reports, setReports] = useState([]);
    const [allShift, setAllShift] = useState([]);
    const [allTruck, setAllTruck] = useState([]);
    const [allActiveTask, setAllActiveTask] = useState([]);
    const [allActiveRoute, setAllActiveRoute] = useState([]);
    
    const userRef = firebase.firestore().collection("users");
    const schedRef = firebase.firestore().collection("schedule");
    const reportRef = firebase.firestore().collection("generalUsersReports");
    const postRef = firebase.firestore().collection("posts");
    const likeRef = firebase.firestore().collection("likes");
    const commentRef = firebase.firestore().collection("comments");
    const sihftRef = firebase.firestore().collection("collectorShift");
    const truckRef = firebase.firestore().collection("trucks");
    const activeRef = firebase.firestore().collection("activeTask");
    const activeRouteRef = firebase.firestore().collection("routeForActiveCollection");

    const[currentUser, setCurrentUser] = useState();
    const[currentId, setCurrentId] = useState();
    const[currentMun, setCurrentMun] = useState();

    const isFocused = useIsFocused();
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
    
    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
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
    }, [])

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setSchedules(newData);
        };
        const unsubscribe = schedRef.onSnapshot(onSnapshot);
        return () => {
            unsubscribe();
        };
    }, [])

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setReports(newData);
        };
        const unsubscribe = reportRef.onSnapshot(onSnapshot);
        return () => {
            unsubscribe();
        };
    }, [])

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllShift(newData);
        };
        const unsubscribe = sihftRef.onSnapshot(onSnapshot);
        return () => {
            unsubscribe();
        };
    }, [])

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllTruck(newData);
        };
        const unsubscribe = truckRef.onSnapshot(onSnapshot);
        return () => {
            unsubscribe();
        };
    }, [])

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllActiveTask(newData);
        };
        const unsubscribe = activeRef.onSnapshot(onSnapshot);
        return () => {
            unsubscribe();
        };
    }, [])

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllActiveRoute(newData);
        };
        const unsubscribe = activeRouteRef.onSnapshot(onSnapshot);
        return () => {
            unsubscribe();
        };
    }, [])

    useEffect(() => {
        const getCurrentUser = async() => {
            const username = await AsyncStorage.getItem('userUName');
            const id = await AsyncStorage.getItem('userId');
            const municipality = await AsyncStorage.getItem('userMunicipality')
            setCurrentUser(username);
            setCurrentId(id);
            setCurrentMun(municipality);
        };
        getCurrentUser();
    }, [])

    function displayCollectionInProgress() {
        return (
          <View style={{ gap: 15, marginBottom: 10 }}>
            {allActiveTask.map((task) => {
                let municipality;
                users.map((user) => {
                    if(user.id === task.userId) {
                        users.map((user2) => {
                            if(user.lguCode === user2.lguCode && user2.accountType === 'LGU / Waste Management Head') {
                                municipality = user2.municipality;
                            }
                        })
                    }
                });
                if(task.taskType === 'Collection' && municipality === currentMun) {
                    return(
                        <View key={task.id} style={{ display: 'flex', flexDirection: 'row', flex: 1, width: '100%', backgroundColor: '#FFE082', borderRadius: 15, overflow: 'hidden' }}>
                            <View style={{ display: 'flex', flex: 1, height: '100%', backgroundColor: '#FBC02D', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                                <View style={{ width: 50, height: 50, borderRadius: 100, backgroundColor: '#E65100', justifyContent: 'center', alignItems: 'center' }}>
                                    <Icon name='truck' style={{ fontSize: 35, color: '#F9A825' }} />
                                </View>
                            </View>
                            <View style={{ display: 'flex', flex: 3, marginLeft: 10}}>
                                <View style={{ width: '90%', paddingVertical: 5 }}>
                                    <Text style={{ fontSize: 16, fontWeight: 900, color: '#FF6F00' }}>Collection In Progress</Text>
                                    {allShift.map((shift) => {
                                        if(shift.id === task.shiftId) {
                                            return(
                                                allTruck.map((truck) => {
                                                    if(shift.truckId === truck.id) {
                                                        return(
                                                            <Text key={truck.id} ellipsizeMode='tail' numberOfLines={1} style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>Garbage Truck Plate No: {truck.plateNo}</Text>
                                                        );
                                                    }
                                                })
                                            );
                                        }
                                    })}
                                    {allShift.map((shift) => {
                                        if(shift.id === task.shiftId) {
                                            return(
                                                allTruck.map((truck) => {
                                                    if(shift.truckId === truck.id) {
                                                        let fullName;
                                                        users.map((user) => {
                                                            if(truck.driverID === user.id) {
                                                                fullName = user.firstName + ' ' + user.lastName;
                                                            }
                                                        })
                                                        return(
                                                            <Text key={truck.id} ellipsizeMode='tail' numberOfLines={1} style={{ fontSize: 13 }}>Driver: {fullName}</Text>
                                                        );
                                                    }
                                                })
                                            );
                                        }
                                    })}
                                    {allShift.map((shift) => {
                                        if(shift.id === task.shiftId) {
                                            return(
                                                <Text key={shift.id} style={{ fontSize: 11 }}>{shift.shiftStartDateTime}</Text>
                                            );
                                        }
                                    })}
                                </View>
                            </View>
                        </View>
                    );
                }
            })}
          </View>
        );
    }

    function displayNotif(displayNotifType) {
        const currentDate = moment().utcOffset('+08').format('YYYY-MM-DD');

        const fullArray = [
            ...reports.map((report) => ({...report, dateTimeUploaded: report.dateTime, notifType: 'Report'})),
            ...schedules.map((sched) => ({...sched, dateTimeUploaded: sched.dateTimeUploaded, userId: sched.userID, notifType: 'Schedule'}))
        ];

        const notifCollection = fullArray.sort((a, b) => b.dateTimeUploaded.localeCompare(a.dateTimeUploaded));

        // try {
            const temp = [];
            notifCollection.map((notif) => {
                let username;
                let municipality;
                let currentAccDate;
                users.map((user) => {
                    if(user.id == notif.userId) {
                        username = user.username;
                        municipality = user.municipality;
                    }
                })
                users.map((user) => {
                    if(user.id === currentId && user.username === currentUser) {
                        currentAccDate = user.dateTime;
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
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13, fontWeight: 600, marginTop: -1}}>Garbage Collection scheduled by {username}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={2} style={{fontSize: 13}}>{notif.description}</Text>
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
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13, fontWeight: 600, marginTop: -1}}>Event scheduled by {username}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13}}>{notif.description}</Text>
                                        <Text style={{fontSize: 12, fontWeight: 700}}>Start Time: {notif.startTime}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    }
                    if(notif.notifType === 'Schedule' && notif.type === 'Assignment') {
                        let plateNo;
                        let driver;
                        let driverUName;
                        let members = [];
                        let creator;
                        let creatorUName;
                        allTruck.map((truck) => {
                            if(truck.plateNo === notif.assignedTruck) {
                                plateNo = truck.plateNo;
                                driver = truck.driverID;
                                truck.members.collector.map((member) => {
                                    members.push(member.id);
                                })
                                creator = notif.userID;
                            }
                        })
                        users.map((user) => {
                            if(user.id === driver) {
                                driverUName = user.username;
                            }
                            if(user.id === creator) {
                                creatorUName = user.username;
                            }
                        })
                        
                        if(notif.userID === currentId || (plateNo === notif.assignedTruck && driverUName === currentUser)) {
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
                                            <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13, fontWeight: 600, marginTop: -1}}>Assignment for {driverUName} by {creatorUName}</Text>
                                            <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13}}>{notif.description}</Text>
                                            <Text style={{fontSize: 12, fontWeight: 700}}>Start Time: {notif.startTime}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        }
                    }
                }



                if (displayNotifType === 'All' && notif.dateTimeUploaded >= currentAccDate) {
                    if ((notif.notifType === 'Report' && notif.status === 'collected') && notif.municipality === currentMun) {
                        temp.push(
                            <View style={{ display: 'flex', flex: 1, width: '100%', height: 90, backgroundColor: 'rgb(231, 247, 233)', borderRadius: 15, overflow: 'hidden', flexDirection: 'row' }}>
                                <View style={{ height: '100%', width: 70, backgroundColor: 'rgb(189,228,124)', justifyContent: 'center', alignItems: 'center' }}>
                                    <View style={{width: 50, height: 50, borderRadius: 100, backgroundColor: 'rgb(81,175,91)', justifyContent: 'center', alignItems: 'center'}}>
                                        <Ionicons name='checkmark-outline' style={{ fontSize: 45, color: 'rgb(13,86,1)' }} />
                                    </View>
                                </View>
                                <View style={{display: 'flex', flex: 1, marginLeft: 10, marginTop: 7}}>
                                    <View style={{width: '90%'}}>
                                        <Text style={{fontSize: 16, fontWeight: 900, color: 'rgb(13,86,1)'}}>{notif.notifType} is Collected</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13, fontWeight: 600}}>Garbage Report by {username}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13}}>{notif.location}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 16, color:'#00A215', textTransform: 'uppercase', fontWeight: 'bold'}}>{notif.status}</Text>
                                    </View>
                                </View>
                            </View>
                        ); 
                    }              
                    if(notif.notifType === 'Report' && notif.municipality === currentMun) {
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
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13, fontWeight: 600}}>Garbage Report by {username}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13}}>{notif.description}</Text>
                                        <Text style={{fontSize: 10}}>{notif.dateTimeUploaded}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    } else if((notif.notifType === 'Schedule' && notif.type === 'Collection') && municipality === currentMun) {
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
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13, fontWeight: 600}}>Garbage Collection scheduled by {username}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13}}>{notif.description}</Text>
                                        <Text style={{fontSize: 10}}>{notif.dateTimeUploaded}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    } else if((notif.notifType === 'Schedule' && notif.type === 'Event') && municipality === currentMun) {
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
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13, fontWeight: 600}}>Event scheduled by {username}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13}}>{notif.description}</Text>
                                        <Text style={{fontSize: 10}}>{notif.dateTimeUploaded}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    }
                    if((notif.notifType === 'Schedule' && notif.type === 'Assignment') && municipality === currentMun) {
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
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13, fontWeight: 600, marginTop: -1}}>Assigned Garbage Truck {notif.assignedTruck}</Text>
                                        <Text ellipsizeMode='tail' numberOfLines={1} style={{fontSize: 13}}>{notif.description}</Text>
                                        <Text style={{fontSize: 10}}>{notif.dateTimeUploaded}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    }
                }
            });

            <ul>
                {temp.map(item =>
                    <li key="item">{item}</li>
                )}
            </ul>

            return (
                <View style={{gap: 15, marginBottom: 20, display: 'flex', flex: 1}}>
                    {temp}
                </View>
            );
        // } catch(e) {}
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
              <View style={{ marginTop: 10, width: 330 }}>
                <View style={{flexDirection: 'row', gap: 10, alignItems: 'center'}}>
                  <Text style={{ fontSize: 20, fontWeight: 700, color: 'rgb(13,86,1)', marginBottom: 5 }}>Reminder Today</Text>
                  <Text>
                    <Text style={{fontWeight: 600}}>{moment().utcOffset('+08').format('dddd')}</Text>, {moment().utcOffset('+08').format('MM/DD/YYYY')}
                  </Text>
                </View>
                {displayCollectionInProgress()}
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
