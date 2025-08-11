import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const apiBase = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:4000');

class CaregiverSearchScreen extends StatefulWidget {
  const CaregiverSearchScreen({super.key});
  @override
  State<CaregiverSearchScreen> createState() => _CaregiverSearchScreenState();
}

class _CaregiverSearchScreenState extends State<CaregiverSearchScreen> {
  final qCtrl = TextEditingController();
  List<dynamic> items = [];

  Future<void> search() async {
    final url = Uri.parse('$apiBase/caregivers?q=${Uri.encodeComponent(qCtrl.text)}');
    final res = await http.get(url);
    if (res.statusCode == 200) {
      setState(() => items = (jsonDecode(res.body) as Map<String, dynamic>)['items'] as List<dynamic>);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Find Caregivers')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          TextField(controller: qCtrl, decoration: const InputDecoration(labelText: 'Search')),
          const SizedBox(height: 8),
          ElevatedButton(onPressed: search, child: const Text('Search')),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              itemCount: items.length,
              itemBuilder: (_, i) {
                final c = items[i] as Map<String, dynamic>;
                return ListTile(
                  title: Text(c['fullName'] ?? ''),
                  subtitle: Text(c['city'] ?? ''),
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CaregiverDetailScreen(caregiver: c))),
                );
              },
            ),
          )
        ]),
      ),
    );
  }
}

class CaregiverDetailScreen extends StatelessWidget {
  final Map<String, dynamic> caregiver;
  const CaregiverDetailScreen({super.key, required this.caregiver});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(caregiver['fullName'] ?? 'Caregiver')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('City: ${caregiver['city'] ?? ''}')
        , const SizedBox(height: 8),
          ElevatedButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => BookingCreateScreen(caregiverId: caregiver['id']))), child: const Text('Book')),
        ]),
      ),
    );
  }
}

class BookingCreateScreen extends StatefulWidget {
  final String caregiverId;
  const BookingCreateScreen({super.key, required this.caregiverId});

  @override
  State<BookingCreateScreen> createState() => _BookingCreateScreenState();
}

class _BookingCreateScreenState extends State<BookingCreateScreen> {
  final startCtrl = TextEditingController();
  final endCtrl = TextEditingController();
  final notesCtrl = TextEditingController();

  Future<void> create() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final res = await http.post(Uri.parse('$apiBase/bookings'),
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer $token' },
      body: jsonEncode({
        'caregiverId': widget.caregiverId,
        'startTime': startCtrl.text,
        'endTime': endCtrl.text,
        'type': 'HOURLY',
        'notes': notesCtrl.text,
      })
    );
    if (res.statusCode == 200 && mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Booking')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          TextField(controller: startCtrl, decoration: const InputDecoration(labelText: 'Start (ISO time)')),
          TextField(controller: endCtrl, decoration: const InputDecoration(labelText: 'End (ISO time)')),
          TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Notes')),
          const SizedBox(height: 8),
          ElevatedButton(onPressed: create, child: const Text('Create')),
        ]),
      ),
    );
  }
}

class CareLogsScreen extends StatefulWidget {
  final String bookingId;
  const CareLogsScreen({super.key, required this.bookingId});

  @override
  State<CareLogsScreen> createState() => _CareLogsScreenState();
}

class _CareLogsScreenState extends State<CareLogsScreen> {
  List<dynamic> logs = [];
  final moodCtrl = TextEditingController();
  final notesCtrl = TextEditingController();

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final res = await http.get(Uri.parse('$apiBase/carelogs/booking/${widget.bookingId}'), headers: { 'Authorization': 'Bearer $token' });
    if (res.statusCode == 200) setState(() => logs = (jsonDecode(res.body) as Map<String, dynamic>)['items'] as List<dynamic>);
  }

  Future<void> submit() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final res = await http.post(Uri.parse('$apiBase/carelogs'), headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer $token' }, body: jsonEncode({ 'bookingId': widget.bookingId, 'mood': moodCtrl.text, 'notes': notesCtrl.text }));
    if (res.statusCode == 200) load();
  }

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Care Logs')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          Expanded(child: ListView.builder(
            itemCount: logs.length,
            itemBuilder: (_, i) {
              final l = logs[i] as Map<String, dynamic>;
              return ListTile(title: Text(l['mood'] ?? ''), subtitle: Text(l['notes'] ?? ''));
            },
          )),
          TextField(controller: moodCtrl, decoration: const InputDecoration(labelText: 'Mood')),
          TextField(controller: notesCtrl, decoration: const InputDecoration(labelText: 'Notes')),
          const SizedBox(height: 8),
          ElevatedButton(onPressed: submit, child: const Text('Submit (caregiver)')),
        ]),
      ),
    );
  }
}