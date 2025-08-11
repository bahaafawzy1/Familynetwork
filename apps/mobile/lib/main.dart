import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:mixpanel_flutter/mixpanel_flutter.dart';
import 'search_booking.dart';

const apiBase = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:4000');
const firebaseOptionsJson = String.fromEnvironment('FIREBASE_OPTIONS_JSON', defaultValue: '{}');
const mixpanelToken = String.fromEnvironment('MIXPANEL_TOKEN', defaultValue: '');

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Firebase init if provided
  if (firebaseOptionsJson.isNotEmpty && firebaseOptionsJson != '{}') {
    final opts = Map<String, dynamic>.from(jsonDecode(firebaseOptionsJson) as Map);
    await Firebase.initializeApp(options: FirebaseOptions(
      apiKey: opts['apiKey'], appId: opts['appId'], messagingSenderId: opts['messagingSenderId'], projectId: opts['projectId'], storageBucket: opts['storageBucket'], authDomain: opts['authDomain']
    ));
  }
  // Mixpanel
  if (mixpanelToken.isNotEmpty) {
    await Mixpanel.init(mixpanelToken, optOutTrackingDefault: false);
  }
  runApp(const App());
}

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Family Care Network',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.teal),
      home: const LoginScreen(),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController phoneCtrl = TextEditingController();
  final TextEditingController emailCtrl = TextEditingController();
  final TextEditingController codeCtrl = TextEditingController();
  String step = 'enter';
  String role = 'FAMILY';
  String message = '';

  Future<void> requestOtp() async {
    setState(() => message = '');
    final body = emailCtrl.text.isNotEmpty ? { 'email': emailCtrl.text } : { 'phoneE164': phoneCtrl.text };
    final res = await http.post(Uri.parse('$apiBase/auth/request-otp'), headers: { 'Content-Type': 'application/json' }, body: jsonEncode(body));
    if (res.statusCode == 200) setState(() => step = 'code'); else setState(() => message = 'Failed to send code');
  }

  Future<void> verifyOtp() async {
    setState(() => message = '');
    final body = {
      if (emailCtrl.text.isNotEmpty) 'email': emailCtrl.text else 'phoneE164': phoneCtrl.text,
      'code': codeCtrl.text,
      'role': role,
    };
    final res = await http.post(Uri.parse('$apiBase/auth/verify-otp'), headers: { 'Content-Type': 'application/json' }, body: jsonEncode(body));
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['token']);
      if (role == 'FAMILY') {
        // go to family profile setup
        if (!mounted) return; Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const FamilyProfileScreen()));
      } else {
        if (!mounted) return; Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const CaregiverProfileScreen()));
      }
    } else {
      setState(() => message = 'Invalid code');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login / Signup')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (step == 'enter') ...[
              const Text('Choose Role'),
              DropdownButton<String>(
                value: role,
                items: const [
                  DropdownMenuItem(value: 'FAMILY', child: Text('Family')),
                  DropdownMenuItem(value: 'CAREGIVER', child: Text('Caregiver')),
                ],
                onChanged: (v) => setState(() => role = v ?? 'FAMILY'),
              ),
              TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Phone (+20...)')),
              const Text('or'),
              TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email')),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: requestOtp, child: const Text('Send Code')),
            ] else ...[
              TextField(controller: codeCtrl, decoration: const InputDecoration(labelText: 'Enter Code')),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: verifyOtp, child: const Text('Verify')),
            ],
            if (message.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Text(message, style: const TextStyle(color: Colors.red))),
          ],
        ),
      ),
    );
  }
}

class FamilyProfileScreen extends StatefulWidget {
  const FamilyProfileScreen({super.key});

  @override
  State<FamilyProfileScreen> createState() => _FamilyProfileScreenState();
}

class _FamilyProfileScreenState extends State<FamilyProfileScreen> {
  final nameCtrl = TextEditingController();
  final cityCtrl = TextEditingController();

  Future<void> save() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final res = await http.put(Uri.parse('$apiBase/me/family'), headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer $token' }, body: jsonEncode({ 'displayName': nameCtrl.text, 'city': cityCtrl.text }));
    if (res.statusCode == 200) {
      if (!mounted) return; Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const HomeScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Family Profile')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Display name')),
          TextField(controller: cityCtrl, decoration: const InputDecoration(labelText: 'City')),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: save, child: const Text('Save')),
        ]),
      ),
    );
  }
}

class CaregiverProfileScreen extends StatefulWidget {
  const CaregiverProfileScreen({super.key});

  @override
  State<CaregiverProfileScreen> createState() => _CaregiverProfileScreenState();
}

class _CaregiverProfileScreenState extends State<CaregiverProfileScreen> {
  final nameCtrl = TextEditingController();
  final cityCtrl = TextEditingController();

  Future<void> save() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final res = await http.put(Uri.parse('$apiBase/me/caregiver'), headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer $token' }, body: jsonEncode({ 'fullName': nameCtrl.text, 'city': cityCtrl.text }));
    if (res.statusCode == 200) {
      if (!mounted) return; Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const HomeScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Caregiver Profile')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Full name')),
          TextField(controller: cityCtrl, decoration: const InputDecoration(labelText: 'City')),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: save, child: const Text('Save')),
        ]),
      ),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ElevatedButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CaregiverSearchScreen())), child: const Text('Find Caregivers')),
        ]),
      ),
    );
  }
}