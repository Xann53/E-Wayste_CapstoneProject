import Layout1 from "./route1";
//import MessageLayout from "./app/tab/messageTabs/messageAuth";

export default function App() {
    return (
        <>
        <Layout1/>
        </>
    );
};


/*import { StyleSheet, ScrollView, Text, SafeAreaView, Image, TouchableOpacity, View, Button, TextInput } from 'react-native';
import { useState, useEffect } from "react";
import { db } from "./firebase_config";
import { collection, getDocs } from 'firebase/firestore';

export default function App() {
    const usersCollectionRef = collection(db, "users")

    const [users, setUsers] = useState([]);

    useEffect(() => {
        const getUsers = async () => {
            const data = await getDocs(usersCollectionRef);

            setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })))
        };
        getUsers();
    }, [])

    return (
        <>
            {users.map((user) => {
                return (
                    <View>
                        <Text>First Name: {user.firstName}</Text>
                        <Text>First Name: {user.lastName}</Text>
                        <Text>First Name: {user.username}</Text>
                        <Text>First Name: {user.email}</Text>
                        <Text>First Name: {user.password}</Text>
                    </View>
                );
            })}
        </>
    );
};*/