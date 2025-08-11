import 'dart:async';
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

Map<String, dynamic> _decodeJwt(String token) {
  try {
    final parts = token.split('.');
    if (parts.length != 3) return {};
    final payload = utf8.decode(base64Url.decode(base64Url.normalize(parts[1])));
    return jsonDecode(payload) as Map<String, dynamic>;
  } catch (_) {
    return {};
  }
}

class ChatScreen extends StatefulWidget {
  final String threadId;
  const ChatScreen({super.key, required this.threadId});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final msgCtrl = TextEditingController();
  String userId = '';
  String role = '';
  StreamSubscription? presenceTimer;

  @override
  void initState() {
    super.initState();
    _initUser();
  }

  Future<void> _initUser() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token') ?? '';
    final payload = _decodeJwt(token);
    setState(() {
      userId = (payload['sub'] ?? '') as String;
      role = (payload['role'] ?? '') as String;
    });
    _startPresence();
  }

  void _startPresence() {
    if (userId.isEmpty) return;
    final presenceRef = FirebaseFirestore.instance.collection('presence').doc(userId);
    presenceRef.set({ 'online': true, 'updatedAt': FieldValue.serverTimestamp(), 'role': role }, SetOptions(merge: true));
    presenceTimer = Stream.periodic(const Duration(seconds: 30)).listen((_) {
      presenceRef.update({ 'online': true, 'updatedAt': FieldValue.serverTimestamp() });
    });
  }

  @override
  void dispose() {
    presenceTimer?.cancel();
    if (userId.isNotEmpty) {
      FirebaseFirestore.instance.collection('presence').doc(userId).set({ 'online': false, 'updatedAt': FieldValue.serverTimestamp() }, SetOptions(merge: true));
    }
    super.dispose();
  }

  Future<void> _send() async {
    final text = msgCtrl.text.trim();
    if (text.isEmpty || userId.isEmpty) return;
    final coll = FirebaseFirestore.instance.collection('chats').doc(widget.threadId).collection('messages');
    await coll.add({ 'text': text, 'senderId': userId, 'senderRole': role, 'createdAt': FieldValue.serverTimestamp() });
    msgCtrl.clear();
  }

  @override
  Widget build(BuildContext context) {
    final messages = FirebaseFirestore.instance
        .collection('chats')
        .doc(widget.threadId)
        .collection('messages')
        .orderBy('createdAt', descending: true)
        .snapshots();

    return Scaffold(
      appBar: AppBar(title: Text('Chat ${widget.threadId}')),
      body: Column(children: [
        Expanded(
          child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
            stream: messages,
            builder: (context, snapshot) {
              if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
              final docs = snapshot.data!.docs;
              return ListView.builder(
                reverse: true,
                itemCount: docs.length,
                itemBuilder: (_, i) {
                  final m = docs[i].data();
                  final isMine = m['senderId'] == userId;
                  return Align(
                    alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isMine ? Colors.teal.shade100 : Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('${m['text'] ?? ''}'),
                        Text(m['senderRole'] ?? '', style: const TextStyle(fontSize: 10, color: Colors.black54)),
                      ]),
                    ),
                  );
                },
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: Row(children: [
            Expanded(child: TextField(controller: msgCtrl, decoration: const InputDecoration(hintText: 'Message'))),
            IconButton(onPressed: _send, icon: const Icon(Icons.send))
          ]),
        )
      ]),
    );
  }
}