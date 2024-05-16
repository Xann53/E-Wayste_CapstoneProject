import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { SelectList } from "react-native-dropdown-select-list";
import CheckBox from "../../components/CheckBox";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from 'react-native-vector-icons/Ionicons';

import { db, auth } from "../../firebase_config";
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export default function Registration1({ navigation, clearForm }) {
    const [agree, setAgree] = useState(false);
    const [province, setProvince] = useState("");
    const [municipality, setMunicipality] = useState("");
    const [barangay, setBarangay] = useState("");
    const [contactNo, setContactNo] = useState("");
    const [provincesData, setProvincesData] = useState([]);
    const [municipalitiesData, setMunicipalitiesData] = useState([]);
    const [barangaysData, setBarangaysData] = useState([]);
    
    const usersCollection = collection(db, "users");

    const fetchProvinces = async () => {
        try {
            const response = await fetch('https://psgc.cloud/api/provinces');
            const data = await response.json();
            setProvincesData(data);
        } catch (error) {
            console.error('Error fetching provinces data:', error);
        }
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
        } catch (error) {
            console.error('Error fetching municipalities data:', error);
        }
    };

    useEffect(() => {
        if (province) {
            fetchMunicipalities(province);
        }
    }, [province]);

    const fetchBarangays = async (municipalityCode) => {
        try {
            const response = await fetch(`https://psgc.cloud/api/cities-municipalities/${municipalityCode}/barangays`);
            const data = await response.json();
            setBarangaysData(data);
        } catch (error) {
            console.error('Error fetching barangays data:', error);
        }
    };

    useEffect(() => {
        if (municipality) {
            fetchBarangays(municipality);
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

    const ProvinceOptions = sortedProvincesData.map(provinceData => ({
        key: provinceData.code,
        value: provinceData.name
    }));

    const MunicipalityOptions = municipalitiesData.map(municipalityData => ({
        key: municipalityData.code,
        value: municipalityData.name
    }));

    const BarangayOptions = barangaysData.map(barangayData => ({
        key: barangayData.code,
        value: barangayData.name
    })); 

    const retrieveData = async () => {
        console.log("Province:", province);
        console.log("Municipality:", municipality);
        console.log("Barangay:", barangay);
        console.log("Contact Number:", contactNo);
    
        if ((province && municipality && barangay && contactNo) && 
            (province.length > 0 && municipality.length > 0 && barangay.length > 0 && contactNo.length > 0)) {
            try {
                const accountType = await AsyncStorage.getItem('accountType');
                const firstName = await AsyncStorage.getItem('accountFName');
                const lastName = await AsyncStorage.getItem('accountLName');
                const username = await AsyncStorage.getItem('accountUName');
                const email = await AsyncStorage.getItem('accountEmail');
                const password = await AsyncStorage.getItem('accountPass');
                AsyncStorage.flushGetRequests();
                registerUser(accountType, firstName, lastName, username, email, password);
            } catch (error) {
                alert(error.message);
            }   
        } else {
            alert("Empty or Incomplete form! Unable to save data.");
        }
        setProvince("");
        setMunicipality("");
        setBarangay("");
    };
    
    
    
    const registerUser = async (accountType, firstName, lastName, username, email, password) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            createUser(accountType, firstName, lastName, username, email);
        } catch(error) {
            alert(error.message);
        }
    };
    
    const createUser = async (accountType, firstName, lastName, username, email) => {
        const fullDateTime = moment().utcOffset('+08:00').format('YYYY/MM/DD HH:mm:ss a');

        const account = await addDoc(usersCollection, {
            accountType: accountType,
            firstName: firstName,
            lastName: lastName,
            username: username,
            email: email,
            province: provincesData.find(p => p.code === province)?.name || "", // Get the name corresponding to the selected province code
            municipality: municipalitiesData.find(m => m.code === municipality)?.name || "", // Get the name corresponding to the selected municipality code
            barangay: barangaysData.find(b => b.code === barangay)?.name || "", // Get the name corresponding to the selected barangay code
            contactNo: contactNo
        });
        await AsyncStorage.clear();
        await signOut(auth);
        clearForm();
        Redirect();
    };

    function clearForm() {
        setProvince("");
        setMunicipality("");
        setBarangay("");
        setContactNo("");
    }

    function Redirect() {
        alert('Account Created.');
        navigation.navigate('login');
    }

    return (
        <ScrollView contentContainerStyle={{flexGrow:1}}>
            <View style={styles.container}>
                <View style={{position: 'absolute',width: '100%', alignItems: 'flex-start', top: 30, left: 20}}>
                    <TouchableOpacity onPress={() => { clearForm(); navigation.navigate('register') }}>
                        <Ionicons name='arrow-back' style={{fontSize: 40, color: 'rgba(16, 139, 0, 1)'}} />
                    </TouchableOpacity>
                </View>
                <View style={styles.containerFrm}>
                    <Text style={styles.title}>CREATE ACCOUNT</Text>
                    <SelectList
                        setSelected={(value) => setProvince(value)} // Make sure this corresponds to the correct state setter
                        data={ProvinceOptions}
                        boxStyles={{
                            width: 270,
                            height: 40,
                            backgroundColor: "rgb(189,228,124)",
                            borderRadius: 10,
                            color: "rgba(45, 105, 35, 1)",
                            borderWidth: 0,
                            paddingLeft: 10,
                            paddingVertical: 0,
                            marginVertical: 5,
                            alignItems: 'center',
                        }}
                        dropdownStyles={{
                            width: 270,
                            backgroundColor: "rgb(231,247,233)",
                            top: -10,
                            marginBottom: -10,
                            borderRadius: 0,
                            zIndex: -1,
                            borderWidth: 0,
                            alignSelf: 'center',
                        }}
                        search={false}
                        placeholder="Province"
                        selected={province}  // Make sure this corresponds to the correct state variable
                    />
                    <SelectList
                        setSelected={(value) => setMunicipality(value)}
                        data={MunicipalityOptions}
                        boxStyles={{
                            width: 270,
                            height: 40,
                            backgroundColor: "rgb(189,228,124)",
                            borderRadius: 10,
                            color: "rgba(45, 105, 35, 1)",
                            borderWidth: 0,
                            paddingLeft: 10,
                            paddingVertical: 0,
                            marginVertical: 5,
                            alignItems: 'center',
                        }}
                        dropdownStyles={{
                            width: 270,
                            backgroundColor: "rgb(231,247,233)",
                            top: -10,
                            marginBottom: -10,
                            borderRadius: 0,
                            zIndex: -1,
                            borderWidth: 0,
                            alignSelf: 'center',
                        }}
                        search={false}
                        placeholder="Municipality"
                        selected={municipality} 
                    />
                    <SelectList
                        setSelected={(value) => setBarangay(value)}
                        data={BarangayOptions}
                        boxStyles={{
                            width: 270,
                            height: 40,
                            backgroundColor: "rgb(189,228,124)",
                            borderRadius: 10,
                            color: "rgba(45, 105, 35, 1)",
                            borderWidth: 0,
                            paddingLeft: 10,
                            paddingVertical: 0,
                            marginVertical: 5,
                            alignItems: 'center',
                        }}
                        dropdownStyles={{
                            width: 270,
                            backgroundColor: "rgb(231,247,233)",
                            top: -10,
                            marginBottom: -10,
                            borderRadius: 0,
                            zIndex: -1,
                            borderWidth: 0,
                            alignSelf: 'center',
                        }}
                        search={false}
                        placeholder="Barangay"
                        selected={barangay}
                    />
                    <TextInput
                        value={contactNo}
                        style={styles.input}
                        placeholder="Contact Number"
                        onChangeText={(e) => {setContactNo(e)}}
                    />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    containerBtn: {
        top: 250,
        gap: 10,
    },
    containerFrm: {
        justifyContent: 'center',
        alignItems: 'center',
        top: 170,
    },
    containerChkbx: {
        flexDirection: "row",
        top: 210,
        left: -12,
        width: 260,
    },
    title: {
        fontWeight: "900",
        fontSize: 30,
        bottom: 30,
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
        // color: 'rgba(45, 105, 35, 1)',
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
        padding: 10,
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
        padding: 10,
        verticalAlign: 'middle',
        color: 'rgb(81,175,91)',
        fontWeight: '900',
    },
});