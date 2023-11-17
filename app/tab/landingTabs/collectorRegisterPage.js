import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import CheckBox from '../../../components/CheckBox';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from 'react-native-vector-icons/Ionicons';

import { db, auth } from '../../../firebase_config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function Registration2({ navigation }) {
    const [agree, setAgree] = useState(false);
    const [province, setProvince] = useState("");
    const [municipality, setMunicipality] = useState("");
    const [barangay, setBarangay] = useState("");
    const [contactNo, setContactNo] = useState("");
    const [plateNo, setPlateNo] = useState("");
    
    const usersCollection = collection(db, "users");

    const retrieveData = async () => {
        if ((province && municipality && barangay && contactNo) && (province.length > 0 && municipality.length > 0 && barangay.length > 0 && contactNo.length > 0)) {
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
    }
    
    const registerUser = async (accountType, firstName, lastName, username, email, password) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            createUser(accountType, firstName, lastName, username, email);
        } catch(error) {
            alert(error.message);
        }
    };
    
    const createUser = async (accountType, firstName, lastName, username, email) => {
        const account = await addDoc(usersCollection, {
            accountType: accountType,
            firstName: firstName,
            lastName: lastName,
            username: username,
            email: email,
            province: province,
            municipality: municipality,
            barangay: barangay,
            contactNo: contactNo,
            plateNo: plateNo
        });
        await AsyncStorage.clear();
        await AsyncStorage.setItem('userId', account.id);
        await AsyncStorage.setItem('userType', accountType);
        await AsyncStorage.setItem('userFName', firstName);
        await AsyncStorage.setItem('userLName', lastName);
        await AsyncStorage.setItem('userUName', username);
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('userProvince', province);
        await AsyncStorage.setItem('userMunicipality', municipality);
        await AsyncStorage.setItem('userBarangay', barangay);
        await AsyncStorage.setItem('userContact', contactNo);
        await AsyncStorage.setItem('userPlateNo', plateNo);
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
        navigation.navigate('collectorRoute');
    }

    return (
        <ScrollView contentContainerStyle={{flexGrow:1}}>
            <View style={styles.container}>
                <View style={{position: 'absolute',width: '100%', alignItems: 'flex-start', top: 30, left: 20}}>
                    <TouchableOpacity onPress={() => {clearForm(); navigation.navigate('register')}}>
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
        top: 210,
        gap: 10,
    },
    containerFrm: {
        justifyContent: 'center',
        alignItems: 'center',
        top: 130,
    },
    containerChkbx: {
        flexDirection: "row",
        top: 170,
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