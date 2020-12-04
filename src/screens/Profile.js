import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity, Image, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { PieChart } from 'react-native-chart-kit'
import AsyncStorage from '@react-native-async-storage/async-storage';

import firebase from '../FirebaseConfig';

import BasicButton from "../components/BasicButton";
import SnackBar from "../components/SnackBar";

export default function Profile() {
    const [profilePicUri, setProfilePicUri] = useState(require("../../assets/profile.png"));
    const [hasImageChanged, setHasImageChanged] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [ageGroup, setAgeGroup] = useState("");
    const [aboutYou, setAboutYou] = useState("");

    const [performanceData, setPerformanceData] = useState({
        "total": 0,
        "correct": 0,
        "incorrect": 0,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [snackBarVisible, setSnackBarVisible] = useState(false);
    const [snackBarText, setSnackBarText] = useState("");
    const [snackBarType, setSnackBarType] = useState("");

    //component did mount
    useEffect(() => {
        //asking for permission to access phone's gallery
        (async () => {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestCameraRollPermissionsAsync();
                if (status !== 'granted') {
                    alert('Sorry, we need camera roll permissions to make this work!');
                }
            }
        })();

        //getting users data from firebase
        fetchUsersData();
    }, []);

    //function to functions users data from firebase
    async function fetchUsersData() {
        const loggedUserId = await AsyncStorage.getItem('loggedUserId');
        if (loggedUserId) {
            const usersDbRef = firebase.app().database().ref('users/');
            usersDbRef
                .child(loggedUserId)
                .once('value')
                .then(resp => {
                    const response = resp.val();
                    if (response) {
                        //for getting performance pie chart
                        let total = 0;
                        let correct = 0;
                        let incorrect = 0;

                        const quizResponses = response.quizResponses;
                        for (const idx in quizResponses) {
                            const quizResponse = quizResponses[idx];
                            const responses = quizResponse.responses || [];

                            const tempTotal = responses.length || 0;
                            total += tempTotal;
                            for (const responsesIdx in responses) {
                                const ansResponse = responses[responsesIdx];
                                const isCorrect = ansResponse["isCorrect"];
                                if (isCorrect) {
                                    correct++;
                                }
                            }
                            console.log("total", total);
                        }
                        incorrect = total - correct;

                        //updating state
                        setName(response.name);
                        setEmail(response.email);
                        setAboutYou(response.desc);
                        setAgeGroup(response.ageGroup);
                        setPerformanceData({
                            total,
                            correct,
                            incorrect,
                        });

                        if (response.profilePicUri) {
                            setProfilePicUri({ uri: response.profilePicUri })
                        }

                        setIsLoading(false);
                    }
                })
                .catch(error => {
                    displaySnackBar("error", "Something went wrong");
                });
        } else {
            displaySnackBar("error", "User is not logged in");
        }
    }

    //function to display snackbar
    function displaySnackBar(type, text) {
        setSnackBarType(type);
        setSnackBarText(text);
        setSnackBarVisible(true);
    }

    //function to hide snackbar
    function hideSnackBar() {
        setSnackBarVisible(false);
    }

    //function to handle when login btn is clicked on
    function handleSaveBtnClick() {
        console.log("save btn clicked");
    }

    //function to handle when profile pic edit btn is clicked on
    async function handleProfilePicEditBtnClick() {
        console.log("edit profile pic btn clicked");
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 1,
        });

        if (!result.cancelled) {
            setHasImageChanged(true);
            setProfilePicUri(result.uri);
        }
    }

    //component rendering
    return (
        <>
            {
                isLoading ?
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator style={styles.loader} />
                    </View>
                    :
                    <ScrollView style={styles.container}>
                        <View style={styles.form}>
                            <View style={styles.imageContainer}>
                                <Image source={profilePicUri} style={styles.image} />
                                <TouchableOpacity onPress={handleProfilePicEditBtnClick}>
                                    <Image source={require('../../assets/edit.png')} style={styles.editIcon} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.divider}></View>

                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.inputField}
                                placeholder="Enter your name"
                                value={name}
                                onChangeText={(val) => setName(val)}
                            />
                            <View style={styles.divider}></View>

                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.inputField}
                                keyboardType="email-address"
                                placeholder="Enter your registered email"
                                value={email}
                                onChangeText={(val) => setEmail(val)}
                            />
                            <View style={styles.divider}></View>

                            <Text style={styles.label}>Age Group</Text>
                            <Picker
                                style={styles.inputField}
                                selectedValue={ageGroup}
                                onValueChange={(ageGroup, itemIndex) => setAgeGroup(ageGroup)}
                            >
                                <Picker.Item label="" value="" />
                                <Picker.Item label="1-4" value="1-4" />
                                <Picker.Item label="5-12" value="5-12" />
                                <Picker.Item label="13-18" value="13-18" />
                            </Picker>
                            <View style={styles.divider}></View>

                            <Text style={styles.label}>About Yourself</Text>
                            <TextInput
                                style={styles.inputField}
                                multiline
                                placeholder="describe yourself"
                                value={aboutYou}
                                onChangeText={(val) => setAboutYou(val)}
                            />
                            <View style={styles.divider}></View>
                        </View>

                        <Text style={styles.label}>Performance</Text>
                        <Text style={styles.totalData}>Total attempted: {performanceData.total}</Text>
                        <View style={styles.chartContainer}>
                            <PieChart
                                data={[
                                    {
                                        name: 'Correct',
                                        population: performanceData.correct,
                                        color: '#34A853',
                                        legendFontColor: '#34A853',
                                        legendFontSize: 14,
                                    },
                                    {
                                        name: 'Incorrect',
                                        population: performanceData.incorrect,
                                        color: '#EB4335',
                                        legendFontColor: '#EB4335',
                                        legendFontSize: 14,
                                    }
                                ]}
                                width={Dimensions.get("screen").width}
                                height={220}
                                chartConfig={{
                                    backgroundColor: '#e26a00',
                                    backgroundGradientFrom: '#fb8c00',
                                    backgroundGradientTo: '#ffa726',
                                    decimalPlaces: 2, // optional, defaults to 2dp
                                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                    style: {
                                        borderRadius: 16
                                    }
                                }}

                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="20"
                                absolute
                            />
                        </View>

                        <View style={styles.divider}></View>
                        <BasicButton
                            text="Save"
                            onPress={handleSaveBtnClick}
                        />
                        <View style={styles.divider}></View>
                    </ScrollView>
            }

            {
                snackBarVisible ?
                    <SnackBar
                        isVisible={snackBarVisible}
                        text={snackBarText}
                        type={snackBarType}
                        onClose={hideSnackBar}
                    />
                    : null
            }
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 10,
        paddingHorizontal: 30,
    },

    title: {
        fontWeight: '500',
        fontSize: 20,
        letterSpacing: 0.1,
        color: '#2E2E2E',
    },

    imageContainer: {
        width: 120,
        height: 120,
        alignSelf: "center",
        shadowColor: 'grey',
        shadowOpacity: .8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 10,
    },

    image: {
        alignSelf: "center",
        width: "100%",
        height: "100%",
        borderRadius: 1000,
    },

    editIcon: {
        width: 20,
        height: 20,
        position: "absolute",
        bottom: 0,
        right: 0,
    },

    label: {
        fontSize: 16,
        lineHeight: 18,
        color: '#666666',
        marginBottom: 3,
    },

    inputField: {
        fontSize: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#BFBFBF',
        paddingVertical: 6,
    },

    divider: {
        paddingVertical: 8,
    },

    chartContainer: {
        alignItems: "center",
    },

    totalData: {
        fontWeight: '500',
        fontSize: 15,
        lineHeight: 20,
        color: '#757575',
        marginVertical: 10,
    },

    loaderContainer: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 30,
        justifyContent: "center",
    },
});