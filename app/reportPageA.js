import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parse } from 'date-fns';

import { db, auth, storage, firebase } from '../firebase_config';
import { collection, addDoc,getDoc, doc,getDocs, query, where, onSnapshot} from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { Circle } from 'react-native-progress';
import { fetchUserId } from '../components/userService';
import OpenSideBar from '../components/OpenSideNav';

export default function ReportAut({navigation}) {
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
    const [reportsToday, setReportsToday] = useState(0);
    const [totalReports, setTotalReports] = useState(0);
    const [collectedCount, setCollectedCount] = useState(0);
    const [uncollectedCount, setUncollectedCount] = useState(0);
    const [circleSize, setCircleSize] = useState(100); 
    const [circleThickness, setCircleThickness] = useState(10); 
    const [progress1, setProgress1] = useState(0); 
    const [progress2, setProgress2] = useState(0);
    const [viewAllReports, setViewAllReports] = useState(false);
    const currentDate = new Date().toISOString().split('T')[0];

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

    useEffect(() => {
        const fetchMunicipality = async () => {
            try {
                const userId = await fetchUserId();
    
                if (userId) {
                    const userDoc = await getDoc(doc(db, 'users', userId));
                    
                    if (userDoc.exists()) {
                        const municipality = userDoc.data().municipality;
                        console.log('Municipality of the logged-in user:', municipality);
                    } else {
                        console.log('User document not found.');
                    }
                } else {
                    console.log('User ID not found.');
                }
            } catch (error) {
                console.error('Error fetching municipality:', error);
            }
        };
    
        fetchMunicipality();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const reportsCollection = collection(db, "generalUsersReports");
            const collectedQuery = query(reportsCollection, where("status", "==", "collected"));
            const uncollectedQuery = query(reportsCollection, where("status", "==", "uncollected"));

            const collectedUnsubscribe = onSnapshot(collectedQuery, (snapshot) => {
                const size = snapshot.size;
                setProgress1(size);
            });
            const uncollectedUnsubscribe = onSnapshot(uncollectedQuery, (snapshot) => {
                const size = snapshot.size;
                setProgress2(size);
            });
            return () => {
                collectedUnsubscribe();
                uncollectedUnsubscribe();
            };
        };
        fetchData();
    }, []);
  
      useEffect(() => {
        const fetchReports = async () => {
            try {
                const userId = await fetchUserId();
                if (userId) {
                    const userDoc = await getDoc(doc(db, 'users', userId));
                    if (userDoc.exists()) {
                        const municipality = userDoc.data().municipality;
    
                        const collectedQuery = query(collection(db, 'generalUsersReports'),
                            where('municipality', '==', municipality),
                            where('status', '==', 'collected')
                        );
                        const collectedSnapshot = await getDocs(collectedQuery);
                        const collectedCount = collectedSnapshot.size;
                        setCollectedCount(collectedCount);
    
                        const uncollectedQuery = query(collection(db, 'generalUsersReports'),
                            where('municipality', '==', municipality),
                            where('status', '==', 'uncollected')
                        );
                        const uncollectedSnapshot = await getDocs(uncollectedQuery);
                        const uncollectedCount = uncollectedSnapshot.size;
                        setUncollectedCount(uncollectedCount);

                        const totalReports = collectedCount + uncollectedCount;
                        const collectedPercentage = (collectedCount / totalReports) * 100;
                        const uncollectedPercentage = (uncollectedCount / totalReports) * 100;
                        setProgress1(collectedPercentage);
                        setProgress2(uncollectedPercentage);
                    } else {
                        console.log('User document not found.');
                    }
                } else {
                    console.log('User ID not found.');
                }
            } catch (error) {
                console.log('Error fetching reports:', error);
            }
        };
        fetchReports();
    }, []);

    const retrieveUserData = async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            const userType = await AsyncStorage.getItem('userType');
            const userFName = await AsyncStorage.getItem('userFName');
            const userLName = await AsyncStorage.getItem('userLName');
            const userUName = await AsyncStorage.getItem('userUName');
            const userEmail = await AsyncStorage.getItem('userEmail');
            const userProvince = await AsyncStorage.getItem('userProvince');
            const userMunicipality = await AsyncStorage.getItem('userMunicipality');
            const userBarangay = await AsyncStorage.getItem('userBarangay');
            const userContact = await AsyncStorage.getItem('userContact');
            const userLguCode = await AsyncStorage.getItem('userLguCode');
            
            // Concatenate user data
            const userDataString = `${userId}, ${userType}, ${userFName}, ${userLName}, ${userUName}, ${userEmail}, ${userProvince}, ${userMunicipality}, ${userBarangay}, ${userContact}, ${userLguCode}`;
    
            // Log the concatenated user data
            console.log('User Data:', userDataString);
        } catch (error) {
            console.error('Error retrieving user data:', error);
        }
    };
    
    useEffect(() => {
        retrieveUserData();
    }, []);

    const [userMunicipality, setUserMunicipality] = useState('');
        
    useEffect(() => {
        const retrieveUserData = async () => {
            try {
                // Retrieve user municipality from AsyncStorage
                const userMunicipality = await AsyncStorage.getItem('userMunicipality');
                setUserMunicipality(userMunicipality);
            } catch (error) {
                console.error('Error retrieving user municipality:', error);
            }
        };

        retrieveUserData();
    }, []);
    

    useEffect(() => {
        const currentDate = new Date().toISOString().split('T')[0]; 
        const fetchReports = async () => {
            try {
                const userId = await fetchUserId();
                if (userId) {
                    const userDoc = await getDoc(doc(db, 'users', userId));
                    if (userDoc.exists()) {
                        const municipality = userDoc.data().municipality;
    
                        const todayQuery = query(collection(db, 'generalUsersReports'), 
                            where('dateTime', '>=', currentDate),
                            where('municipality', '==', municipality) 
                        );
                        const todaySnapshot = await getDocs(todayQuery);
                        const todayReports = [];
            
                        todaySnapshot.forEach(doc => {
                            const report = doc.data();
                            const reportDate = parse(report.dateTime, 'yyyy/MM/dd hh:mm:ss a', new Date());
            
                            if (reportDate.toISOString().split('T')[0] === currentDate) {
                                todayReports.push(report);
                            }
                        });
            
                        setReportsToday(todayReports.length);
            
                        const allReportsQuery = query(collection(db, 'generalUsersReports'), 
                            where('municipality', '==', municipality) 
                        );
                        const allReportsSnapshot = await getDocs(allReportsQuery);
                        const totalReportsCount = allReportsSnapshot.size;
                        setTotalReports(totalReportsCount);
                    } else {
                        console.log('User document not found.');
                    }
                } else {
                    console.log('User ID not found.');
                }
            } catch (error) {
                console.log('Error fetching reports:', error);
            }
        };
    
        fetchReports();
    }, [currentDate]);

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
                    const {associatedImage, dateTime, description,municipality, location, status, userId} = doc.data();
                    uploads.push({
                        id: doc.id,
                        associatedImage,
                        dateTime,
                        description,
                        municipality,
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

    function BodyContent() {
        userUploads.map((uploads) => {
            var valueToPush = { };
            valueToPush["id"] = uploads.id;
            valueToPush["imageLink"] = uploads.associatedImage;
            valueToPush["dateTime"] = uploads.dateTime;
            valueToPush["description"] = uploads.description;
            valueToPush["municipality"] = uploads.municipality;
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
        const filteredUploads = uploadCollection.filter(upload => upload.municipality === userMunicipality);


        let temp = [];
        filteredUploads.map((post) => {
            if (post.status === 'collected') {
                return;
            }
        
            let imageURL;
            if (Array.isArray(imageCol) && imageCol.length > 0) {
                if (post.imageLink) {
                    imageURL = imageCol.find(url => url.includes(post.imageLink)) || '';
                }          
            }

            temp.push(
                <View style={[styles.contentButton, styles.contentGap]}>
                    <View activeOpacity={0.5}>
                        <View style={styles.contentButtonFront}>
                            <SafeAreaView style={{width: '100%', marginVertical: 10, paddingHorizontal: 22, paddingBottom: 5, borderBottomWidth: 1, borderColor: 'rgba(190, 190, 190, 1)'}}>
                            <Text style={{ fontSize: 13 }}>
                            <Text style={{ fontWeight: 'bold' }}>Reported By:</Text> {users.map((user) => {if(post.userId === user.id) {return user.username;}})} </Text>
                            <Text style={{ fontSize: 13 }}>
                            <Text style={{ fontWeight: 'bold' }}>Date Reported:</Text> {post.dateTime} </Text>
                            <Text style={{ fontSize: 13 }}>
                            <Text style={{ fontWeight: 'bold' }}>Location</Text> {post.location} </Text>
                            <Text style={{ fontSize: 13 }}>
                            <Text style={{ fontWeight: 'bold' }}>Status of Report:</Text> {post.status} </Text>
                                <View style={{ width: '100%', height: 250, backgroundColor: 'white', marginVertical: 5,  justifyContent: 'flex-start', alignItems: 'flex-start'}}>
                                    {imageURL ? (
                                            <Image source={{ uri: imageURL }} style={{ width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 10, justifyContent: 'flex-start' }} />
                                        ) : (
                                            <Text>No Image Available</Text>
                                        )}
                                    </View>   
                            </SafeAreaView>
                        </View>
                    </View>
                </View>
            );
            return null;
        });
        
        <ul>
            {temp.map(item =>
                <li key="{item}">{item}</li>
            )}
        </ul>

        return (
            <View style={{gap: 10}}>
                {temp}
            </View>
        );
    }


    function ViewAllContent() {
        const [selectedReport, setSelectedReport] = useState(null);
        const currentDate = new Date().toISOString().split('T')[0];
    
        const filteredUploads = userUploads.filter(upload => upload.municipality === userMunicipality);
        const reportsToShow = viewAllReports
        ? filteredUploads.filter(report => report && report.dateTime && report.dateTime.includes(currentDate))
        : filteredUploads.filter(report => {
            const reportDate = parse(report.dateTime, 'yyyy/MM/dd hh:mm:ss a', new Date());
            const reportDateString = reportDate.toISOString().split('T')[0];
            return reportDateString === currentDate;
        });
    
        const imageList = viewAllReports && imageCol
            .filter(url => filteredUploads.some(report => {
                const reportDate = parse(report.dateTime, 'yyyy/MM/dd hh:mm:ss a', new Date());
                const reportDateString = reportDate.toISOString().split('T')[0];
                
                return report && report.dateTime && reportDateString === currentDate && url.includes(report.associatedImage);
            }))
            .map((url, index) => (
                <View key={index} style={{ width: 80, height: 80, backgroundColor: '#D6D6D8', marginVertical: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 10 }}>
                    <Image source={{ uri: url }} style={{ width: '100%', height: '100%', flex: 1, resizeMode: 'cover', borderRadius: 10 }} />
                </View>
            ));
    
        const reportList = reportsToShow.map(uploads => (
            <View key={uploads.id} activeOpacity={0.5} onPress={() => setSelectedReport(uploads)}>
                <View style={{ width: 315, backgroundColor: 'rgb(230, 230, 230)', borderRadius: 5, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 1, elevation: 5 }}>
                    <View style={{ width: '100%', backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', color: 'rgba(113, 112, 108, 1)' }}>
                        <SafeAreaView style={{ width: '100%', marginVertical: 10, paddingHorizontal: 22, paddingBottom: 5, borderBottomWidth: 1, borderColor: 'rgba(190, 190, 190, 1)' }}>
                            <Text style={{ fontSize: 12 }}>
                                <Text style={{ fontWeight: 'bold' }}>Reported By:</Text> {users.map((user) => { if (uploads.userId === user.id) { return user.username; } })} </Text>
                            <Text style={{ fontSize: 12 }}>
                                <Text style={{ fontWeight: 'bold' }}>Date Reported:</Text> {uploads.dateTime} </Text>
                            <Text style={{ fontSize: 12 }}>
                                <Text style={{ fontWeight: 'bold' }}>Location</Text> {uploads.location} </Text>
                            <Text style={{ fontSize: 12 }}>
                                <Text style={{ fontWeight: 'bold' }}>Status of Report:</Text> {uploads.status} </Text>
                            <View style={{ width: '100%', height: 250, backgroundColor: 'white', marginVertical: 5, justifyContent: 'flex-start', alignItems: 'flex-start', borderBottomEndRadius: 10 }}>
                                {imageCol && imageCol.length > 0 && (
                                    imageCol.find(url => url.includes(uploads.associatedImage)) && (
                                        <Image source={{ uri: imageCol.find(url => url.includes(uploads.associatedImage)) }} style={{ width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 10, justifyContent: 'flex-start' }} />
                                    )
                                )}
                            </View>
                        </SafeAreaView>
                    </View>
                </View>
            </View>
        ));

        return (
            <View>
                <View style={{ flexDirection: 'row', marginHorizontal: 10, gap: 10 }}>
                    {imageList}
                </View>
                <View style={{ flexDirection: 'row', marginHorizontal: 10, gap: 10 }}>
                    {reportList}
                </View>
            </View>
        );
    }           

    function HeaderContent() {
        return (
            <>
                <Text style={{fontSize: 18, fontWeight: 700, color:'rgb(55,55,55)', textAlign: 'center'}}>REPORT SUMMARY</Text> 
                <View style={{flexDirection: 'row', gap: 5, top: 3}}>
                    <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 12, fontWeight: 'bold', color:'rgb(55,55,55)', marginBottom: 5}}>REPORTS TODAY</Text>
                        <View style={styles.headerCntr}>
                            <Text style={{fontSize: 24, fontWeight: 700, color:'rgb(55,55,55)'}}>{reportsToday}</Text>
                            <Text style={{fontSize: 10, fontWeight: 700, color:'rgb(55,55,55)'}}>Garbages</Text>
                        </View>
                    </View>
                    <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 12, fontWeight: 'bold', color:'rgb(55,55,55)', marginBottom: 5}}>TOTAL REPORT</Text>
                        <View style={styles.headerCntr}>
                            <Text style={{fontSize: 24, fontWeight: 700, color:'rgb(55,55,55)'}}>{totalReports}</Text>
                            <Text style={{fontSize: 10, fontWeight: 700, color:'rgb(55,55,55)'}}>Garbages</Text>
                        </View>
                    </View>
               </View>
                <View style={{flexDirection: 'row', gap: 5, top: 3}}>
                    <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 12, fontWeight: 'bold', color:'rgb(55,55,55)', marginBottom: 5, paddingTop: 5}}>UNCOLLECTED</Text>
                        <View style={styles.headerCntr}>
                            <Text style={{fontSize: 24, fontWeight: 700, color:'rgb(55,55,55)'}}>{uncollectedCount}</Text>
                            <Text style={{fontSize: 10, fontWeight: 700, color:'rgb(55,55,55)'}}>Garbages</Text>
                        </View>
                    </View>
                    <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 12, fontWeight: 'bold', color:'rgb(55,55,55)', marginBottom: 5, paddingTop: 5}}>COLLECTED</Text>
                        <View style={styles.headerCntr}>
                            <Text style={{fontSize: 24, fontWeight: 700, color:'rgb(55,55,55)'}}>{collectedCount}</Text>
                            <Text style={{fontSize: 10, fontWeight: 700, color:'rgb(55,55,55)'}}>Garbages</Text>
                        </View>
                    </View>
             
              </View>
          </>  
        );
    }


    return (
        <>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
                <SafeAreaView style={styles.container}>
                    <TouchableOpacity activeOpacity={0.5} style={{ position: 'absolute', left: 20, top: 30, zIndex: 99 }} onPress={() => {setOpenSideBar(SideNavigation(navigation))}}>
                        <Ionicons name='menu' style={{ fontSize: 40, color: '#ffffff' }} />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.5} style={{ position: 'absolute', right: 20, top: 31, zIndex: 99 }} onPress={() => {navigation.navigate('notification')}}>
                        <Ionicons name='notifications' style={{ fontSize: 35, color: '#ffffff' }} />
                    </TouchableOpacity>
                    <View style={styles.header1}>
                        <View style={styles.header2}>
                            <Image
                                source={require('../assets/NatureVector.jpg')}
                                style={{
                                    resizeMode: 'stretch',
                                    width: '100%',
                                    height: '150%',
                                    opacity: 0.5,
                                }}
                            />
                        </View>
                    </View>
                    <View style={styles.header3}>
                    {HeaderContent()}
                    </View>
                    <SafeAreaView style={styles.body}>
                        <View style={styles.chartContainer}>
                    <View style ={styles.outerCircle}>
                            <Circle
                                size={circleSize}
                                indeterminate={false}
                                progress={progress1 / 100}
                                borderColor="transparent" // Change the color as needed
                                color="green"
                                unfilledColor="white"
                                thickness={circleThickness}
                            /><Text style={{ marginTop: -circleSize / 2.3 + circleThickness * 3, fontSize: 12, fontWeight: 'bold', color: 'rgb(55,55,55)' }}>
                            {(progress1).toFixed(2)}% {/* Use toFixed(2) to display only two decimal places */}
                            </Text>
                     </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
                                <View style={styles.headerCntrCol}>
                                    {/* Green Square */}
                                </View>
                                 <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgb(55,55,55)' , marginLeft: 6}}>Collected Garbage</Text>
                         </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
                                    <View style={styles.headerCntrCol2}>
                                    {/* Yellow Square */}
                                        </View>
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgb(55,55,55)', marginLeft:  5}}>Uncollected Garbage</Text>
                           </View>
    
                    <View style ={styles.innerCircle}>
                                {/* Progress Circle 2 */}
                            <Circle
                                size={circleSize - circleThickness * 3}
                                indeterminate={false}
                                progress={progress2 / 100}
                                borderColor="transparent" // Change the color as needed
                                color="yellow"
                                unfilledColor="#FAF9F6"
                                thickness={circleThickness}
                            />
                           <Text style={{ marginTop: -circleSize / 2.3 + circleThickness * 3, fontSize: 12, fontWeight: 'bold', color: 'rgb(55,55,55)' }}>
                            {(progress2).toFixed(2)}% </Text>
                        </View>
                        </View>
                        <View style={{alignItems: 'center'}}>
                            <Text style={{fontSize: 23, fontWeight: 700, color: '#0D5601', padding: 5}}>REPORTS</Text>
                        </View>
                        <View>
                        <View style={{ width: 315, backgroundColor: '#ffffff', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', width: '100%' }}>
                                    <Text style={{ left: 10, marginTop: 15, fontWeight: 700 }}>REPORTS TODAY</Text>
                                    <TouchableOpacity
                                        activeOpacity={0.5}
                                        style={{ position: 'absolute', right: 15, marginTop: 15 }}
                                        onPress={() => setViewAllReports(!viewAllReports)}
                                    >
                                        <Text style={{ textDecorationLine: 'underline' }}>
                                            View all
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
                </SafeAreaView>
            </ScrollView>
            {openSideBar}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'rgb(246, 242, 239)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingBottom: 60,
    },
    header1: {
        width: '100%',
        height: 252,
        backgroundColor: 'rgb(220, 130, 47)',
        zIndex: -50,
    },
    header2: {
        width: '100%',
        height: '90%',
        backgroundColor: 'rgb(134, 202, 81)',
        overflow: 'hidden',
        alignItems: 'center',
    },
    header3: {
        position: 'absolute',
        width: 310,
        height: 210,
        top: 70,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.30,
        shadowRadius: 10,
        elevation: 6,
        zIndex: 50,
        alignItems: 'center',
        paddingTop: 10,
        
    },
    body: {
        position: 'relative',
        width: 330,
        backgroundColor: 'rgb(228,237,229)',
        paddingTop: 50,
        paddingBottom: 10,
        alignItems: 'center',
    },
    headerCntr: {
        width: 110,
        height: 57,
        backgroundColor: 'rgb(255,248,172)',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentButton: {
        width: 315,
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
        backgroundColor: '#ffffff',
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

    chartContainer: {
        width: 300,
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E6E6E6',
        backgroundColor: '#F5F5DC',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 2,
        justifyContent: 'center',
        alignItems: 'center',   
        
      },
      outerCircle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        paddingBottom: 10,
      },
      innerCircle: {
        position: 'absolute',
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: 45,
      
        
      },
      headerCntrChart :{

        width: 50,
        height: 50,
        backgroundColor: 'rgb(255,248,172)',
        borderRadius: 57 / 2,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 2,
        justifyContent: 'center',
        alignItems: 'center',    

      },
      headerCntrCol: {
        width: 13,
        height: 13,
        marginBottom: 7,
        marginRight: 10,
        backgroundColor: 'green',
       
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCntrCol2: {
        width: 13,
        height: 13,
        backgroundColor: 'yellow',
        overflow: 'hidden',
       
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
})