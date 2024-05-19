import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Button, RefreshControl, Image, Modal } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from 'moment/moment';
import { SelectList } from 'react-native-dropdown-select-list';

import { db, auth, storage, firebase } from '../firebase_config';
import { collection, addDoc, getDocs, query, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { returnKeyType, value } from 'deprecated-react-native-prop-types/DeprecatedTextInputPropTypes';

export default function AddCol({ show }) {
    const addUserRef = collection(db, "users");
    const userRef = firebase.firestore().collection("users");

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [contactNo, setContactNo] = useState('');
    const [province, setProvince] = useState('');
    const [municipality, setMunicipality] = useState('');
    const [barangay, setBarangay] = useState('');
    
    const [allUsers, setAllUsers] = useState([]);
    const [provincesData, setProvincesData] = useState([]);
    const [municipalitiesData, setMunicipalitiesData] = useState([]);
    const [barangaysData, setBarangaysData] = useState([]);

    useEffect(() => {
        const onSnapshot = snapshot => {
            const newData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAllUsers(newData);
        };
        const unsubscribe = userRef.onSnapshot(onSnapshot);
        return () => {
            unsubscribe();
        };
    }, [])

    const fetchProvinces = async () => {
        try {
            const response = await fetch('https://psgc.cloud/api/provinces');
            const data = await response.json();
            setProvincesData(data);
        } catch(e) {}
    };

    useEffect(() => {
        fetchProvinces();
    }, []);

    const fetchMunicipalities = async (provinceCode) => {
        try {
            const response = await fetch(`https://psgc.cloud/api/provinces/${provinceCode}/cities-municipalities`);
            let data = await response.json();
            // Modify municipality names if they contain the word "City"
            data = data.map(municipalityData => ({
                ...municipalityData,
                name: municipalityData.name.includes("City") ? municipalityData.name.replace("City of", "").trim() + " City" : municipalityData.name
            }));
            setMunicipalitiesData(data);
        } catch(e) {}
    };

    useEffect(() => {
        if (province !== '') {
            fetchMunicipalities(province);
        } else {
            setMunicipalitiesData([]);
        }
    }, [province]);

    const fetchBarangays = async (municipalityCode) => {
        try {
            const response = await fetch(`https://psgc.cloud/api/cities-municipalities/${municipalityCode}/barangays`);
            const data = await response.json();
            setBarangaysData(data);
        } catch (e) {}
    };

    useEffect(() => {
        if (municipality !== '') {
            fetchBarangays(municipality);
        } else {
            setBarangaysData([]);
        }
    }, [municipality]);

    const sortedProvincesData = provincesData.slice().sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    });

    let ProvinceOptions = [];
    ProvinceOptions.push({
        key: '',
        value: 'Select option'
    });
    sortedProvincesData.map((provinceData) => {
        ProvinceOptions.push({
            key: provinceData.name,
            value: provinceData.name
        })
    });

    let MunicipalityOptions = [];
    MunicipalityOptions.push({
        key: '',
        value: 'Select option'
    });
    municipalitiesData.map((municipalityData) => {
        MunicipalityOptions.push({
            key: municipalityData.name,
            value: municipalityData.name
        })
    });

    const BarangayOptions = [];
    BarangayOptions.push({
        key: '',
        value: 'Select option'
    });
    barangaysData.map((barangayData) => {
        BarangayOptions.push({
            key: barangayData.name,
            value: barangayData.name
        })
    });

    const addColFunction = async() => {
        const lguCode = await AsyncStorage.getItem('userLguCode');
        const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD hh:mm:ss a');
        const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const username = firstName + '.' + lastName;
        let password = 'pass-';

        if(firstName === '' || lastName === '' || contactNo === '' || province === '' || municipality === '' || barangay === '') {
            alert('Incomplete Form. Please fill in all of the fields.');
        } else {
            let isDuplicate = false;

            allUsers.map((user) => {
                if(user.username === username && user.lguCode === lguCode) {
                    isDuplicate = true;
                }
            })

            if(isDuplicate) {
                alert('Account already exists.');
            } else {
                for (let i = 0; i < 4; i++) {
                    password += characters.charAt(Math.floor(Math.random() * characters.length));
                }
                
                await addDoc(addUserRef, {
                    firstName: firstName,
                    lastName: lastName,
                    contactNo: contactNo,
                    province: province,
                    municipality: municipality,
                    barangay: barangay,
                    accountType: 'Pending',
                    lguCode: lguCode,
                    username: username,
                    password: password,
                    dateTime: fullDateTime
                });

                show(false);
            }
        }
    }

    return(
        <>
            <Modal animationType='fade' visible={true} transparent={true} statusBarTranslucent={true}>
                <View style={{position: 'absolute', display: 'flex', flexDirection: 'row', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)'}}>
                    <View style={{display: 'flex', flex: 0.85, backgroundColor: 'white', padding: 10, borderRadius: 15, gap: 10, alignItems: 'center'}}>

                        <View style={{display: 'flex', flexDirection: 'row', width: '100%', marginBottom: 10}}>
                            <View style={{display: 'flex', flex: 1}} />
                            <View style={{display: 'flex', flex: 10, alignItems: 'center'}}>
                                <Text numberOfLines={1} style={{fontSize: 18, color: 'green', fontWeight: 900}}>ADD NEW COLLECTOR</Text>
                            </View>
                            <View style={{display: 'flex', flex: 1, alignItems: 'flex-end'}}>
                                <TouchableOpacity activeOpacity={0.7} onPress={() => {show(false)}} style={{display: 'flex', backgroundColor: 'orange', padding: 2, paddingHorizontal: 6, borderRadius: 5}}>
                                    <Text style={{color: 'white', fontWeight: 900}}>X</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{display: 'flex', flexDirection: 'row', gap: 10}}>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 1, paddingVertical: 4.5}}>
                                <Text numberOfLines={1} style={{fontSize: 13}}>First name</Text>
                            </View>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 2.5}}>
                                <TextInput
                                    value={firstName}
                                    onChangeText={(val) => {setFirstName(val)}}
                                    style={{
                                        backgroundColor: 'rgb(189,227,124)',
                                        color: 'rgb(45,105,35)',
                                        borderRadius: 5,
                                        paddingHorizontal: 6,
                                        fontSize: 13
                                    }}
                                />
                            </View>
                        </View>

                        <View style={{display: 'flex', flexDirection: 'row', gap: 10}}>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 1, paddingVertical: 4.5}}>
                                <Text numberOfLines={1} style={{fontSize: 13}}>Last name</Text>
                            </View>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 2.5}}>
                                <TextInput
                                    value={lastName}
                                    onChangeText={(val) => {setLastName(val)}}
                                    style={{
                                        backgroundColor: 'rgb(189,227,124)',
                                        color: 'rgb(45,105,35)',
                                        borderRadius: 5,
                                        paddingHorizontal: 6,
                                        fontSize: 13
                                    }}
                                />
                            </View>
                        </View>

                        <View style={{display: 'flex', flexDirection: 'row', gap: 10}}>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 1, paddingVertical: 4.5}}>
                                <Text numberOfLines={1} style={{fontSize: 13}}>Contact No</Text>
                            </View>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 2.5}}>
                                <TextInput
                                    value={contactNo}
                                    onChangeText={(val) => {setContactNo(val)}}
                                    style={{
                                        backgroundColor: 'rgb(189,227,124)',
                                        color: 'rgb(45,105,35)',
                                        borderRadius: 5,
                                        paddingHorizontal: 6,
                                        fontSize: 13
                                    }}
                                />
                            </View>
                        </View>

                        <View style={{display: 'flex', flexDirection: 'row', gap: 10}}>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 1, paddingVertical: 4.5}}>
                                <Text numberOfLines={1} style={{fontSize: 13}}>Province</Text>
                            </View>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 2.5}}>
                                <SelectList
                                    setSelected={(value) => setProvince(value)}
                                    data={ProvinceOptions}
                                    boxStyles={{
                                        backgroundColor: "rgb(189,228,124)",
                                        borderRadius: 5,
                                        color: "rgba(45, 105, 35, 1)",
                                        borderWidth: 0,
                                        paddingHorizontal: 6,
                                        paddingVertical: 5,
                                        alignItems: 'center',
                                        fontSize: 13
                                    }}
                                    dropdownStyles={{
                                        backgroundColor: "rgb(231,247,233)",
                                        top: -20,
                                        marginBottom: -20,
                                        borderRadius: 0,
                                        zIndex: -1,
                                        borderWidth: 0,
                                        fontSize: 13
                                    }}
                                    search={false}
                                    selected={province}
                                />
                            </View>
                        </View>

                        <View style={{display: 'flex', flexDirection: 'row', gap: 10}}>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 1, paddingVertical: 4.5}}>
                                <Text numberOfLines={1} style={{fontSize: 13}}>Municipality</Text>
                            </View>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 2.5}}>
                                <SelectList
                                    setSelected={(value) => setMunicipality(value)}
                                    data={MunicipalityOptions}
                                    boxStyles={{
                                        backgroundColor: "rgb(189,228,124)",
                                        borderRadius: 5,
                                        color: "rgba(45, 105, 35, 1)",
                                        borderWidth: 0,
                                        paddingHorizontal: 6,
                                        paddingVertical: 5,
                                        alignItems: 'center',
                                        fontSize: 13
                                    }}
                                    dropdownStyles={{
                                        backgroundColor: "rgb(231,247,233)",
                                        top: -20,
                                        marginBottom: -20,
                                        borderRadius: 0,
                                        zIndex: -1,
                                        borderWidth: 0,
                                        fontSize: 13
                                    }}
                                    search={false}
                                    selected={municipality}
                                />
                            </View>
                        </View>

                        <View style={{display: 'flex', flexDirection: 'row', gap: 10}}>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 1, paddingVertical: 4.5}}>
                                <Text numberOfLines={1} style={{fontSize: 13}}>Barangay</Text>
                            </View>
                            <View style={{display: 'flex', flexDirection: 'column', flex: 2.5}}>
                            <SelectList
                                    setSelected={(value) => setBarangay(value)}
                                    data={BarangayOptions}
                                    boxStyles={{
                                        backgroundColor: "rgb(189,228,124)",
                                        borderRadius: 5,
                                        color: "rgba(45, 105, 35, 1)",
                                        borderWidth: 0,
                                        paddingHorizontal: 6,
                                        paddingVertical: 5,
                                        alignItems: 'center',
                                        fontSize: 13
                                    }}
                                    dropdownStyles={{
                                        backgroundColor: "rgb(231,247,233)",
                                        top: -20,
                                        marginBottom: -20,
                                        borderRadius: 0,
                                        zIndex: -1,
                                        borderWidth: 0,
                                        fontSize: 13
                                    }}
                                    search={false}
                                    selected={barangay}
                                />
                            </View>
                        </View>

                        <TouchableOpacity activeOpacity={0.7} onPress={() => {addColFunction()}} style={{padding: 6, paddingHorizontal: 17, backgroundColor: 'rgb(220,130,47)', borderRadius: 20, marginTop: 10}}>
                            <Text style={{color: 'white', fontWeight: 800, fontSize: 13}}>ADD COLLECTOR</Text>
                        </TouchableOpacity>

                    </View>
                    <TouchableOpacity onPress={() => {show(false)}} style={{position: 'absolute', zIndex: -1, backgroundColor: 'rgba(0,0,0,0)', width: '100%', height: '100%'}} />
                </View>
            </Modal>
        </>
    );
}