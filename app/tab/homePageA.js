import React from 'react';
import CommentOverlay from '../../components/commentOverlay';
import { fetchUserId } from '../../components/userService';
import SideBar from '../../components/SideNav';
import { StyleSheet, View, Text, TextInput, Share, TouchableOpacity, ScrollView, SafeAreaView, Modal,  RefreshControl, Image} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { db, auth, storage, firebase } from '../../firebase_config';
import { collection, addDoc, getDocs, deleteDoc, query, doc, where, updateDoc} from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

export default function NewsfeedAut({navigation}) {
  const isFocused = useIsFocused();
  const [reportsToday, setReportsToday] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const [openSideBar, setOpenSideBar] = React.useState();
  const [users, setUsers] = useState([]);
  const [userUploads, setUserUploads] = useState([]);
  const [imageCol, setImageCol] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [likedPosts, setLikedPosts] = useState([]); 
  const [commentText, setCommentText] = useState('');

    let uploadCollection = [];
    const usersCollection = collection(db, "users");
    const reportRef = firebase.firestore().collection("generalUsersReports");
    const imageColRef = ref(storage, "postImages/"); 

    const toggleModal = () => {
      setModalVisible((prevIsModalVisible) => !prevIsModalVisible);
    };
    
    const handlePost = async () => {
      // Check if both postTitle and postText are not empty
      if (postTitle.trim() === '' || postText.trim() === '') {
          alert('Please enter a post title and content.');
          return;
      }

      try {
          const userId = await fetchUserId();

          if (!userId) {
              alert('Error fetching user ID.');
              return;
          }

          const postRef = await addDoc(collection(db, 'posts'), {
              postTitle,
              postContent: postText,
              userId, // Use the fetched user ID
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          });
          
          // Store userId in 'users' collection
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, { userId:userId }); 
          
          setPostTitle('');
          setPostText('');
          setModalVisible(false);
      } catch (error) {
          console.error('Error adding post: ', error);
      }
    };
    
    const handleLike = async (postId) => {
      try {
        // Check if the post is already liked
        const isAlreadyLiked = likedPosts.includes(postId);
  
        // Toggle the liked status
        const newLikedPosts = isAlreadyLiked
          ? likedPosts.filter((id) => id !== postId)
          : [...likedPosts, postId];
  
        // Update the state
        setLikedPosts(newLikedPosts);
  
        const userId = await fetchUserId();

        // Update the liked status in the database
        await updateLikesInDatabase(postId, userId, !isAlreadyLiked);
      } catch (error) {
        console.error('Error liking/unliking post: ', error);
      }
    };

  const updateLikesInDatabase = async (postId, userId, isLiked) => {
      try {
          const likesRef = collection(db, 'likes');
          const likedPostQuery = query(likesRef, where('postId', '==', postId), where('userId', '==', userId));
          const likedPostSnapshot = await getDocs(likedPostQuery);
  
          if (!likedPostSnapshot.empty) {
              likedPostSnapshot.forEach(async (doc) => {
                  await deleteDoc(doc.ref);
              });
          } else {
              await addDoc(collection(db, 'likes'), {
                  postId,
                  userId,
                  timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              });
          }
      } catch (error) {
          console.error('Error updating likes in the database: ', error);
      }   
  };

  useEffect(() => {    
    // Fetch liked posts from Firebase
    const fetchLikedPosts = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const likedPostsRef = collection(db, 'likes');
          const userLikedPostsQuery = query(likedPostsRef, where('userId', '==', user.uid));
          const userLikedPostsSnapshot = await getDocs(userLikedPostsQuery);
          const likedPostsIds = userLikedPostsSnapshot.docs.map(doc => doc.data().postId);
          setLikedPosts(likedPostsIds);
        }
      } catch (error) {
        console.error('Error fetching liked posts: ', error);
      }
    };

    // Fetch liked posts when the component mounts
    fetchLikedPosts();
  }, []);

  const handlePostComment = async (postId, commentText) => {
    try {
        if (!commentText || commentText.trim() === '') {
            console.log('Comment cannot be empty.');
            return;
        }

        const user = auth.currentUser;

        if (!user) {
            console.error('User not authenticated.');
            return;
        }

        // Fetch the user ID
        const currentUserId = await fetchUserId();

        if (!currentUserId) {
            console.error('Error fetching user ID.');
            return;
        }

        // Get the current username
        const currentUser = users.find((u) => u.id === currentUserId);

        if (!currentUser) {
            console.error('Current user not found:', currentUserId);
            console.log('All users:', users);
            return;
        }

        const currentUsername = currentUser?.username || 'Unknown User';

        // Prepare the comment data
        const commentData = {
            postId: postId,
            userId: currentUserId,
            username: currentUsername,
            content: commentText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        };

        // Add the comment to the 'comments' collection
        await addDoc(collection(db, 'comments'), commentData);

        // Fetch the updated comments for the current post
        const commentsRef = collection(db, 'comments');
        const postCommentsQuery = query(commentsRef, where('postId', '==', postId));
        const postCommentsSnapshot = await getDocs(postCommentsQuery);
        const commentsData = postCommentsSnapshot.docs.map((doc) => doc.data().content);

        // Update the local state to display the updated comments
        setPostComments((prevComments) => ({
            ...prevComments,
            [postId]: commentsData,
        }));

        // Clear the commentText state
        setCommentText('');
    } catch (error) {
        console.error('Error posting comment: ', error);
    }
};

 useEffect(() => {
      const fetchReports = async () => {
        try {
          const currentDate = new Date();
          const formattedCurrentDate = `${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/${currentDate.getDate()} ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()} ${currentDate.getHours() >= 12 ? 'pm' : 'am'}`;
          
          console.log('Formatted Current Date:', formattedCurrentDate);

          // Query for reports today
          const todayQuery = query(
            collection(db, 'generalUsersReports'),
            where('dateTime', '==', formattedCurrentDate)
          );

          const todaySnapshot = await getDocs(todayQuery);
          const reportsTodayCount = todaySnapshot.size;
          setReportsToday(reportsTodayCount);

          console.log(`Reports fetched for today: ${reportsTodayCount}`);

          // Query for all reports
          const allReportsQuery = query(collection(db, 'generalUsersReports'));
          const allReportsSnapshot = await getDocs(allReportsQuery);
          const totalReportsCount = allReportsSnapshot.size;
          setTotalReports(totalReportsCount);
          console.log(`Total reports fetched: ${totalReportsCount}`);

        } catch (error) {
          console.log('Error fetching reports:', error);
        }
      };
      fetchReports();
    }, [db]);


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
  
  //Share

  const handleSharePress = async (postId, description, imageURL) => {
    try {
      const result = await Share.share({
        title: 'Check out this post!',
        message: `${description}\n\nImage: ${imageURL}`, // Include any additional details you want to share
      });
  
      if (result.action === Share.sharedAction) {
        console.log('Post shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('Sharing dismissed');
      }
    } catch (error) {
      console.error('Error sharing post:', error.message);
    }
  };
  
  

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
      const [isCommentOverlayVisible, setIsCommentOverlayVisible] = useState({});
      const [postComments, setPostComments] = useState({});
      const [currentPostId, setCurrentPostId] = useState(null);

      const handleToggleCommentOverlay = async (postId) => {
        setCurrentPostId(postId);
        setIsCommentOverlayVisible((prevState) => ({
        ...prevState,
        [postId]: !prevState[postId],
        }));

        try {
        const commentsRef = collection(db, 'comments');
        const postCommentsQuery = query(commentsRef, where('postId', '==', postId));
        const postCommentsSnapshot = await getDocs(postCommentsQuery);
        const commentsData = postCommentsSnapshot.docs.map((doc) => doc.data().content);
        setPostComments((prevComments) => ({ ...prevComments, [postId]: commentsData }));
        } catch (error) {
        console.error('Error fetching comments: ', error);
        }
    };

    const handlePostComment = async (postId, commentText) => {
      try {
          if (!commentText || commentText.trim() === '') {
              console.log('Comment cannot be empty.');
              return;
          }
  
          const user = auth.currentUser;
  
          if (!user) {
              console.error('User not authenticated.');
              return;
          }
  
          // Fetch the user ID
          const currentUserId = await fetchUserId();
  
          if (!currentUserId) {
              console.error('Error fetching user ID.');
              return;
          }
  
          // Get the current username
          const currentUser = users.find((u) => u.id === currentUserId);
  
          if (!currentUser) {
              console.error('Current user not found:', currentUserId);
              console.log('All users:', users);
              return;
          }
  
          const currentUsername = currentUser?.username || 'Unknown User';
  
          // Prepare the comment data
          const commentData = {
              postId: postId,
              userId: currentUserId,
              username: currentUsername,
              content: commentText,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          };
  
          // Add the comment to the 'comments' collection
          await addDoc(collection(db, 'comments'), commentData);
  
          // Fetch the updated comments for the current post
          const commentsRef = collection(db, 'comments');
          const postCommentsQuery = query(commentsRef, where('postId', '==', postId));
          const postCommentsSnapshot = await getDocs(postCommentsQuery);
          const commentsData = postCommentsSnapshot.docs.map((doc) => doc.data().content);
  
          // Update the local state to display the updated comments
          setPostComments((prevComments) => ({
              ...prevComments,
              [postId]: commentsData,
          }));
  
          // Clear the commentText state
          setCommentText('');
      } catch (error) {
          console.error('Error posting comment: ', error);
      }
  };

      
        userUploads.map((uploads) => {
          var valueToPush = {};
          valueToPush["id"] = uploads.id;
          valueToPush["imageLink"] = uploads.associatedImage;
          valueToPush["dateTime"] = uploads.dateTime;
          valueToPush["description"] = uploads.description;
          valueToPush["location"] = uploads.location;
          valueToPush["status"] = uploads.status;
          valueToPush["userId"] = uploads.userId;
          uploadCollection.push(valueToPush);
          uploadCollection.sort((a, b) => {
            let fa = a.dateTime,
              fb = b.dateTime;
            if (fa < fb) {
              return -1;
            }
            if (fa > fb) {
              return 1;
            }
            return 0;
          });
        });
      
        let temp = uploadCollection.map((post) => {
          let imageURL;
          imageCol.map((url) => {
            if (url.includes(post.imageLink)) {
              imageURL = url;
            }
          });
      
          return (
            <View style={[styles.contentButton, styles.contentGap]} key={post.id}>
              <TouchableOpacity activeOpacity={0.5}>
                <View style={styles.contentButtonFront}>
                  <View
                    style={{
                      width: '93%',
                      flexDirection: 'row',
                      gap: 10,
                      alignItems: 'center',
                      marginTop: 15,
                    }}
                  >
                    <View style={styles.containerPfp}>
                      <Ionicons name="person-outline" style={styles.placeholderPfp} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: 500,
                          color: 'rgba(113, 112, 108, 1)',
                        }}
                      >
                        {users.map((user) => {
                          if (post.userId === user.id) {
                            return user.username;
                          }
                        })}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: 'rgba(113, 112, 108, 1)',
                          alignSelf: 'flex-end', 
                        }}
                      >
                        {post.dateTime} {/* Display the timestamp */}
                      </Text>
                    </View>
                  </View>
                  <SafeAreaView
                    style={{
                      width: '100%',
                      marginVertical: 10,
                      paddingHorizontal: 22,
                      paddingBottom: 5,
                      borderBottomWidth: 1,
                      borderColor: 'rgba(190, 190, 190, 1)',
                    }}
                  >
                    <Text style={{ fontSize: 13, marginBottom: 5 }}>{post.description}</Text>
                    <View
                      style={{
                        width: '100%',
                        height: 250,
                        backgroundColor: '#D6D6D8',
                        marginVertical: 5,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Image
                        source={{ uri: imageURL }}
                        style={{ width: '100%', height: '100%', flex: 1, resizeMode: 'cover' }}
                      />
                    </View>
                  </SafeAreaView>
                  
                  <View style={{
                      width: '90%',
                      flexDirection: 'row',
                      gap: 10,
                      alignItems: 'center',
                      marginBottom: 10,
                    }}
                  >
                    <Ionicons
                      name={likedPosts.includes(post.id) ? 'heart' : 'heart-outline'}
                      style={{ fontSize: 25, color: likedPosts.includes(post.id) ? 'red' : 'black' }}
                      onPress={() => handleLike(post.id)}
                    />
                  <Ionicons
                      name="chatbubble-outline" style={{ fontSize: 25 }} onPress={() => {handleToggleCommentOverlay(post.id)}}/>
                  <Ionicons
              name="share-outline"
              style={{ fontSize: 25 }}
              onPress={() => handleSharePress(post.id, post.description, imageURL)}
            />
                  </View>
                </View>
              </TouchableOpacity>   
              <View>
              {isCommentOverlayVisible[post.id] && (
                <CommentOverlay
                comments={postComments[post.id] || []}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  handlePostComment={() => handlePostComment(post.id, commentText)}                 
                />
              )}
              </View>
           </View>
          
        );
     });
      
        return <View style={{ gap: 10 }}>{temp}</View>;
      }
      

      function HeaderContent() {
        return (
            <>
                <Text style={{fontSize: 18, fontWeight: 700, color:'rgb(55,55,55)'}}>BANILAD, CEBU CITY</Text>
                <View style={{flexDirection: 'row', gap: 7, top: 5}}>
                    <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 14, fontWeight: 500, color:'rgb(55,55,55)', marginBottom: 5}}>REPORTS TODAY</Text>
                        <View style={styles.headerCntr}>
                            <Text style={{fontSize: 40, fontWeight: 700, color:'rgb(55,55,55)'}}>{reportsToday}</Text>
                            <Text style={{fontSize: 14, fontWeight: 700, color:'rgb(55,55,55)'}}>Garbages</Text>
                        </View>
                    </View>
                    <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 14, fontWeight: 500, color:'rgb(55,55,55)', marginBottom: 5}}>TOTAL REPORT</Text>
                        <View style={styles.headerCntr}>
                            <Text style={{fontSize: 40, fontWeight: 700, color:'rgb(55,55,55)'}}>{totalReports}</Text>
                            <Text style={{fontSize: 14, fontWeight: 700, color:'rgb(55,55,55)'}}>Garbages</Text>
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
                                source={require('../../assets/NatureVector.jpg')}
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
                        <View style={{alignItems: 'center'}}>
                            <Text style={{fontSize: 23, fontWeight: 700, color: 'rgba(3, 73, 4, 1)', marginBottom: 5}}>NEWSFEED</Text>
                        </View>
                        <View style={{width: 315, backgroundColor: 'rgb(230, 230, 230)', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgb(16, 139, 0)', marginBottom: 20}}>
                            <TouchableOpacity activeOpacity={0.5} onPress={toggleModal}>
                                <View style={{backgroundColor: '#ffffff', flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, alignItems: 'center'}}>
                                    <View style={[styles.containerPfp, {width: 30, height: 30}]}>
                                        <Ionicons name='person-outline' style={[styles.placeholderPfp, {fontSize: 20}]} />
                                    </View>
                                    <Text style={{left: 15}}>
                                        What's on your mind?
                                    </Text>
                                    <View style={{position: 'absolute', right:15, width: 70, height: 35, backgroundColor: 'rgb(45, 105, 35)', borderRadius: 20, overflow: 'hidden'}}>
                                    <TouchableOpacity style={styles.modalButton}>
                                      <Text style={{ color: 'white', fontWeight: 'bold' }}>POST</Text>
                                  </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.btnMainContainer}>
                            <View style={[styles.buttonContainer]}>
                                <TouchableOpacity activeOpacity={0.5}>
                                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
                                    <Text style={styles.buttonText}>All</Text>
                                </View>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.buttonContainer]}>
                                <TouchableOpacity activeOpacity={0.5}>
                                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
                                    <Text style={styles.buttonText}>Reports</Text>
                                </View>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.buttonContainer]}>
                                <TouchableOpacity activeOpacity={0.5}>
                                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
                                    <Text style={styles.buttonText}>Events</Text>
                                </View>
                                </TouchableOpacity>
                            </View>
                            </View>
                        {BodyContent()}
                    </SafeAreaView>
                </SafeAreaView>
            </ScrollView>
            {openSideBar}

            <Modal
              animationType="slide"
              transparent={true}
              visible={isModalVisible}
              onRequestClose={toggleModal}
          >
              <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                      <TextInput
                          placeholder="Post Title"
                          value={postTitle}
                          onChangeText={(text) => setPostTitle(text)}
                          style={styles.modalTitleInput} 
                      />
                      <TextInput
                          placeholder="Write your post content here..."
                          multiline
                          value={postText}
                          onChangeText={(text) => setPostText(text)}
                          style={styles.modalTextInput}
                      />
                      <TouchableOpacity style={styles.modalButton} onPress={handlePost}>
                          <Text style={{ color: 'white', fontWeight: 'bold' }}>POST</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalCloseButton} onPress={toggleModal}>
                          <Text style={{ color: 'black' }}>CLOSE</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </Modal>
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
        paddingBottom: 40,
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
        top: 75,
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
        paddingTop: 20,
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
        width: 137,
        height: 90,
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

    container1: {
        fontSize: 18,
        fontWeight: '700',
        color: 'rgb(55,55,55)',
      },
      headerContainer: {
        flexDirection: 'row',
        gap: 7,
        top: 5,
      },
      headerText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgb(55,55,55)',
        marginBottom: 5,
      },
      headerContentContainer: {
        alignItems: 'center',
      },
      headerContent: {
        fontSize: 40,
        fontWeight: '700',
        color: 'rgb(55,55,55)',
      },
      headerContentText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgb(55,55,55)',
      },
      buttonContainer: {
        width: 70,
        height: 35,
        backgroundColor: 'rgb(179, 229, 94)',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        elevation: 3,
      },
      buttonText: {
        fontWeight: '700',
        fontSize: 15,
        color: 'rgb(113, 112, 108)',
      },
      btnMainContainer: {
        width: '100%',
        paddingHorizontal: 10,
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10, marginTop: -10
      },
      // comments
      commentOverlayContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: 'rgba(190, 190, 190, 1)',
        borderRadius: 10,
      },
      commentContainer: {
        maxHeight: 150,
        overflowY: 'auto',
        padding: 10,
      },
      existingComment: {
        marginBottom: 5,
      },
      inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,        
      },
      input: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        marginRight: 10,
        paddingLeft: 10,
      },
      postButton: {
        backgroundColor: 'rgb(81,175,91)',
        padding: 10,
        borderRadius: 5,
      },
      postButtonText: {
        color: '#fff',
        fontWeight: 'bold',
      },
      modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
      },
      modalTitleInput: {
          height: 40, // Adjust the height as needed
          borderColor: 'gray',
          borderWidth: 1,
          borderRadius: 5,
          marginVertical: 10,
          padding: 10,
      },
      modalContent: {
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 20,
          width: '80%',
      },
      modalTextInput: {
          height: 100,
          borderColor: 'gray',
          borderWidth: 1,
          borderRadius: 5,
          marginVertical: 10,
          padding: 10,
      },
      modalButton: {
          backgroundColor: 'green',
          padding: 10,
          borderRadius: 5,
          alignItems: 'center',
      },
      modalCloseButton: {
          backgroundColor: 'lightgray',
          padding: 10,
          borderRadius: 5,
          alignItems: 'center',
          marginTop: 10,
      },
      
});

