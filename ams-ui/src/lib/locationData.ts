// Cascading State → District → Taluka data for admission forms
// Coverage: Maharashtra (36 districts), Karnataka (31 districts), Other

export interface LocationData {
  [state: string]: {
    [district: string]: string[]
  }
}

export const STATES = ['Maharashtra', 'Karnataka', 'Other'] as const

export const LOCATION_DATA: LocationData = {
  Maharashtra: {
    Ahmednagar: ['Ahmednagar', 'Shevgaon', 'Pathardi', 'Parner', 'Sangamner', 'Kopargaon', 'Akole', 'Shrirampur', 'Nevasa', 'Rahata', 'Rahuri', 'Jamkhed', 'Karjat', 'Nagar'],
    Akola: ['Akola', 'Akot', 'Telhara', 'Balapur', 'Patur', 'Murtizapur', 'Barshitakli'],
    Amravati: ['Amravati', 'Achalpur', 'Paratwada', 'Warud', 'Anjangaon Surji', 'Daryapur', 'Chikhaldara', 'Chandur Railway', 'Morshi', 'Nandgaon Khandeshwar', 'Bhatkuli', 'Dhamangaon Railway', 'Chandur Bazar', 'Dharni'],
    Aurangabad: ['Aurangabad', 'Khuldabad', 'Kannad', 'Vaijapur', 'Gangapur', 'Paithan', 'Phulambri', 'Sillod', 'Soegaon'],
    Beed: ['Beed', 'Ashti', 'Patoda', 'Shirur Kasar', 'Georai', 'Majalgaon', 'Wadwani', 'Kaij', 'Dharur', 'Parli', 'Ambajogai'],
    Bhandara: ['Bhandara', 'Tumsar', 'Pauni', 'Mohadi', 'Sakoli', 'Lakhni', 'Lakhandur'],
    Buldhana: ['Buldhana', 'Chikhli', 'Deulgaon Raja', 'Jalgaon Jamod', 'Sangrampur', 'Malkapur', 'Motala', 'Nandura', 'Khamgaon', 'Shegaon', 'Mehkar', 'Sindkhed Raja', 'Lonar'],
    Chandrapur: ['Chandrapur', 'Ballarpur', 'Mul', 'Warora', 'Chimur', 'Bhadravati', 'Brahmapuri', 'Nagbhid', 'Sindewahi', 'Rajura', 'Korpana', 'Pombhurna', 'Gondpipri', 'Jiwati', 'Saoli'],
    Dhule: ['Dhule', 'Sakri', 'Shirpur', 'Sindkheda'],
    Gadchiroli: ['Gadchiroli', 'Dhanora', 'Chamorshi', 'Mulchera', 'Desaiganj', 'Armori', 'Kurkheda', 'Korchi', 'Aheri', 'Bhamragad', 'Sironcha', 'Etapalli'],
    Gondia: ['Gondia', 'Tirora', 'Goregaon', 'Arjuni Morgaon', 'Amgaon', 'Deori', 'Salekasa', 'Sadak Arjuni'],
    Hingoli: ['Hingoli', 'Sengaon', 'Kalamnuri', 'Basmath', 'Aundha Nagnath'],
    Jalgaon: ['Jalgaon', 'Bhusawal', 'Jamner', 'Erandol', 'Dharangaon', 'Amalner', 'Parola', 'Chopda', 'Pachora', 'Yawal', 'Raver', 'Muktainagar', 'Bodwad', 'Chalisgaon', 'Bhadgaon'],
    Jalna: ['Jalna', 'Bhokardan', 'Jafrabad', 'Badnapur', 'Ambad', 'Ghansawangi', 'Partur', 'Mantha'],
    Kolhapur: ['Kolhapur', 'Panhala', 'Shahuwadi', 'Kagal', 'Hatkanangale', 'Shirol', 'Radhanagari', 'Gaganbawda', 'Bhudargad', 'Gadhinglaj', 'Chandgad', 'Ajra', 'Bavda'],
    Latur: ['Latur', 'Renapur', 'Ausa', 'Nilanga', 'Deoni', 'Udgir', 'Chakur', 'Shirur Anantpal', 'Ahmedpur', 'Jalkot'],
    Mumbai_City: ['Mumbai City'],
    Mumbai_Suburban: ['Andheri', 'Borivali', 'Kurla'],
    Nagpur: ['Nagpur', 'Kamptee', 'Hingna', 'Katol', 'Narkhed', 'Savner', 'Kalameshwar', 'Ramtek', 'Mouda', 'Parseoni', 'Umred', 'Kuhi', 'Bhiwapur', 'Mauda'],
    Nanded: ['Nanded', 'Ardhapur', 'Mudkhed', 'Bhokar', 'Umri', 'Loha', 'Kandhar', 'Kinwat', 'Hadgaon', 'Mahur', 'Deglur', 'Mukhed', 'Dharmabad', 'Biloli', 'Naigaon', 'Himayatnagar'],
    Nandurbar: ['Nandurbar', 'Shahada', 'Taloda', 'Akkalkuwa', 'Akrani', 'Dhadgaon'],
    Nashik: ['Nashik', 'Igatpuri', 'Dindori', 'Peth', 'Trimbakeshwar', 'Kalwan', 'Deola', 'Surgana', 'Baglan', 'Malegaon', 'Nandgaon', 'Chandwad', 'Niphad', 'Sinnar', 'Yeola'],
    Osmanabad: ['Osmanabad', 'Tuljapur', 'Omerga', 'Paranda', 'Bhoom', 'Kalamb', 'Washi', 'Lohara'],
    Palghar: ['Palghar', 'Vasai', 'Dahanu', 'Talasari', 'Jawhar', 'Mokhada', 'Vada', 'Vikramgad'],
    Parbhani: ['Parbhani', 'Jintur', 'Selu', 'Gangakhed', 'Pathri', 'Purna', 'Palam', 'Manwath', 'Sonpeth'],
    Pune: ['Pune City', 'Haveli', 'Mulshi', 'Maval', 'Bhor', 'Velhe', 'Purandar', 'Baramati', 'Indapur', 'Daund', 'Shirur', 'Khed', 'Junnar', 'Ambegaon'],
    Raigad: ['Alibag', 'Pen', 'Panvel', 'Uran', 'Karjat', 'Khalapur', 'Mangaon', 'Tala', 'Roha', 'Sudhagad', 'Mahad', 'Poladpur', 'Shrivardhan', 'Mhasla', 'Murud'],
    Ratnagiri: ['Ratnagiri', 'Sangameshwar', 'Lanja', 'Rajapur', 'Chiplun', 'Guhagar', 'Dapoli', 'Mandangad', 'Khed'],
    Sangli: ['Sangli', 'Miraj', 'Tasgaon', 'Jat', 'Walwa', 'Shirala', 'Khanapur', 'Kadegaon', 'Palus', 'Atpadi', 'Kavthe Mahankal'],
    Satara: ['Satara', 'Wai', 'Mahabaleshwar', 'Khandala', 'Phaltan', 'Maan', 'Karad', 'Koregaon', 'Patan', 'Jaoli', 'Khatav'],
    Sindhudurg: ['Sindhudurg', 'Kudal', 'Malwan', 'Sawantwadi', 'Devgad', 'Kankavli', 'Vaibhavwadi', 'Dodamarg'],
    Solapur: ['Solapur North', 'Solapur South', 'Akkalkot', 'Madha', 'Barshi', 'Mangalvedhe', 'Mohol', 'Pandharpur', 'Malshiras', 'Sangola', 'Karmala'],
    Thane: ['Thane', 'Kalyan', 'Murbad', 'Bhiwandi', 'Shahapur', 'Ulhasnagar', 'Ambarnath'],
    Wardha: ['Wardha', 'Deoli', 'Seloo', 'Arvi', 'Ashti', 'Karanja', 'Hinganghat', 'Samudrapur'],
    Washim: ['Washim', 'Malegaon', 'Risod', 'Mangrulpir', 'Karanja', 'Manora'],
    Yavatmal: ['Yavatmal', 'Arni', 'Babhulgaon', 'Kalamb', 'Darwha', 'Digras', 'Ner', 'Pusad', 'Umarkhed', 'Mahagaon', 'Kelapur', 'Ralegaon', 'Ghatanji', 'Wani', 'Maregaon', 'Zari Jamani'],
  },
  Karnataka: {
    Bagalkot: ['Bagalkot', 'Badami', 'Bilgi', 'Hungund', 'Jamkhandi', 'Mudhol'],
    Bangalore_Urban: ['Bangalore North', 'Bangalore South', 'Anekal'],
    Bangalore_Rural: ['Devanahalli', 'Doddaballapur', 'Hosakote', 'Nelamangala'],
    Belagavi: ['Belagavi', 'Athani', 'Bailhongal', 'Chikkodi', 'Gokak', 'Hukkeri', 'Khanapur', 'Raibag', 'Ramdurg', 'Savadatti'],
    Bellary: ['Bellary', 'Hospet', 'Sandur', 'Siruguppa', 'Hadagalli', 'Hagaribommanahalli', 'Kudligi'],
    Bidar: ['Bidar', 'Aurad', 'Basavakalyan', 'Bhalki', 'Humnabad'],
    Chamarajanagar: ['Chamarajanagar', 'Gundlupet', 'Kollegal', 'Yelandur'],
    Chikkaballapur: ['Chikkaballapur', 'Bagepalli', 'Chintamani', 'Gauribidanur', 'Gudibanda', 'Sidlaghatta'],
    Chikkamagaluru: ['Chikkamagaluru', 'Kadur', 'Koppa', 'Mudigere', 'Narasimharajapura', 'Sringeri', 'Tarikere'],
    Chitradurga: ['Chitradurga', 'Challakere', 'Hiriyur', 'Holalkere', 'Hosadurga', 'Molakalmuru'],
    Dakshina_Kannada: ['Mangalore', 'Bantwal', 'Belthangady', 'Puttur', 'Sullia'],
    Davanagere: ['Davanagere', 'Channagiri', 'Harihara', 'Harihar', 'Jagalur', 'Honnali'],
    Dharwad: ['Dharwad', 'Hubli', 'Kalghatgi', 'Kundgol', 'Navalgund'],
    Gadag: ['Gadag', 'Mundargi', 'Nargund', 'Ron', 'Shirahatti'],
    Gulbarga: ['Gulbarga', 'Afzalpur', 'Aland', 'Chincholi', 'Chittapur', 'Jewargi', 'Sedam'],
    Hassan: ['Hassan', 'Alur', 'Arkalgud', 'Arsikere', 'Belur', 'Channarayapatna', 'Holenarasipura', 'Sakleshpur'],
    Haveri: ['Haveri', 'Byadgi', 'Hanagal', 'Hirekerur', 'Ranebennur', 'Savanur', 'Shiggaon'],
    Kodagu: ['Madikeri', 'Somwarpet', 'Virajpet'],
    Kolar: ['Kolar', 'Bangarapet', 'Malur', 'Mulbagal', 'Srinivaspur'],
    Koppal: ['Koppal', 'Gangavathi', 'Kushtagi', 'Yelburga'],
    Mandya: ['Mandya', 'Maddur', 'Malavalli', 'Nagamangala', 'Pandavapura', 'Srirangapatna', 'Krishnarajpet'],
    Mysore: ['Mysore', 'Heggadadevankote', 'Hunsur', 'Krishnarajanagara', 'Nanjangud', 'Periyapatna', 'Tirumakudal Narsipur'],
    Raichur: ['Raichur', 'Devadurga', 'Lingasugur', 'Manvi', 'Sindhanur'],
    Ramanagara: ['Ramanagara', 'Channapatna', 'Kanakapura', 'Magadi'],
    Shimoga: ['Shimoga', 'Bhadravathi', 'Hosanagara', 'Sagar', 'Shikarpur', 'Soraba', 'Thirthahalli'],
    Tumkur: ['Tumkur', 'Gubbi', 'Kunigal', 'Madhugiri', 'Pavagada', 'Sira', 'Tiptur', 'Turuvekere', 'Koratagere', 'Chikkanayakanahalli'],
    Udupi: ['Udupi', 'Karkala', 'Kundapura'],
    Uttara_Kannada: ['Karwar', 'Ankola', 'Bhatkal', 'Haliyal', 'Honavar', 'Kumta', 'Mundgod', 'Siddapur', 'Sirsi', 'Yellapur', 'Joida'],
    Vijayapura: ['Vijayapura', 'Basavana Bagewadi', 'Indi', 'Muddebihal', 'Sindgi'],
    Yadgir: ['Yadgir', 'Shahapur', 'Shorapur'],
  },
  Other: {},
}

// Helper: get districts for a state
export function getDistricts(state: string): string[] {
  return Object.keys(LOCATION_DATA[state] || {}).sort()
}

// Helper: get talukas for a state+district
export function getTalukas(state: string, district: string): string[] {
  return (LOCATION_DATA[state]?.[district] || []).sort()
}
