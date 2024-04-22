import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const CommentOverlay = ({ comments, commentText, setCommentText, handlePostComment }) => {
    return (
      <View style={styles.overlayContainer}>
        {comments.map((comment, index) => (
            <Text key={index} style={styles.commentText}>
              {comment}
            </Text>
        ))}

        <TextInput
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={(text) => setCommentText(text)}
          style={styles.commentInput}
        />

        <TouchableOpacity onPress={handlePostComment} style={styles.postButton}>
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
    );
};  

const styles = StyleSheet.create({
  overlayContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  comment: {
    marginBottom: 5,
  },
  commentText: {
    marginBottom: 5,
  },
  commentInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 8,
    padding: 8,
  },
  postButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  postButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CommentOverlay;
