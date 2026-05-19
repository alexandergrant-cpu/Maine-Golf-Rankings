const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Pulls safely from GitHub's hidden Repository Secrets Manager
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_TOKEN; 
const OUTPUT_FILE = path.join(__dirname, 'players.json');

async function syncHubSpotDatabase() {
    console.log("🔄 Reaching out to secure HubSpot API cloud database...");
    
    if (!HUBSPOT_ACCESS_TOKEN) {
        console.error("❌ Error: HUBSPOT_TOKEN is completely missing from GitHub Secrets setup.");
        process.exit(1);
    }

    try {
        const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
            headers: {
                'Authorization': `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            params: {
                limit: 150,
                // These must exactly match your internal property internal names in HubSpot
                properties: 'firstname,lastname,school,class,gender,hs_grad_year,average_differential,rounds_played,league'
            }
        });

        const hubspotContacts = response.data.results || [];
        console.log(`📡 Connection successful! Pulling ${hubspotContacts.length} total contact items.`);
        
        const formattedPlayers = hubspotContacts.map((contact, index) => {
            const props = contact.properties;
            return {
                id: index + 1,
                name: `${props.firstname || ''} ${props.lastname || ''}`.trim() || `Golfer ${index + 1}`,
                school: props.school || 'Unassigned School',
                class: props.class || 'Class A',
                gender: props.gender || 'Boys',
                league: props.league || 'SMAA', 
                grad: props.hs_grad_year || '2027',
                calculatedDiff: props.average_differential ? parseFloat(props.average_differential) : 99.9,
                roundsCount: props.rounds_played ? parseInt(props.rounds_played) : 0
            };
        });

        // Rewrite the shared file resource payload
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(formattedPlayers, null, 4), 'utf8');
        console.log("✅ Successfully generated a fresh players.json asset data file.");

    } catch (error) {
        console.error("❌ The HubSpot data fetch sequence failed:", error.message);
        process.exit(1);
    }
}

syncHubSpotDatabase();