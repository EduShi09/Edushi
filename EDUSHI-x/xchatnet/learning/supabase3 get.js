// complete table
const { data, error } = await _supabase
  .from('talky_users')
  .select('*');

if (error) console.error('Error:', error);
else console.log('All Rows:', data);

// complete row 
const { data, error } = await _supabase
  .from('talky_users')
  .select('*')
  .eq('id', 1);

if (error) console.error('Error:', error);
else console.log('Row Data:', data);

// by name 


const { data, error } = await _supabase
  .from('talky_users')
  .select('*')
  .eq('name', 'robin');

if (error) console.error('Error:', error);
else console.log('User Row:', data);

//  only one cell
    // id = 1 wale user ka sirf Status janna:
    const { data, error } = await _supabase
        .from('talky_users')
        .select('status') // Sirf status column mangwa rahe hain
        .eq('id', 1)
        .single(); // .single() lagane se array ki jagah direct object milta hai

    if (error) console.error('Error:', error);
    else console.log('Status is:', data.status);

// complete table
const { data, error } = await _supabase
  .from('talky_users')
  .select('name'); // Yahan sirf us column ka naam likhein

if (error) console.error('Error:', error);
else console.log('All Names:', data);