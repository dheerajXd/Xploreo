

# Summary of the interaction

## Basic information
    Domain: Travel and Hospitality Platform (Beyond Booking)
    Problem statement: Travel Itinerary and Coordination Platform
    Date of interaction: 30-01-2026
    Mode of interaction: Video call
    Duration (in-minutes): 75
    Publicly accessible Video link: https://drive.google.com/file/d/1AlW3jiv0zrJ5ZyYugvCh6YpSzLo3u2Ve/view

## Domain Expert Details
    Role/ designation :
    Product Manager -  Travel & Hospitality

    Experience in the domain (Brief description of responsibilities and years of experience in domain):
    19+ years of experience in travel technology, including airline systems, PSS/GDS platforms, and travel product management. Responsibilities include defining product strategy, improving user experience, coordinating stakeholders, and managing complex travel workflows.

    Nature of work: Managerial

## Domain Context and Terminology

• How would you describe the overall purpose of this problem statement in your daily work?  
The purpose of this problem statement is to support travellers who need to plan trips quickly, unexpectedly, or with limited knowledge about a destination. The platform converts user preferences into practical travel plans, reducing research effort, coordination overhead, and decision-making stress. The focus is on planning and coordination rather than only booking.

• What are the primary goals or outcomes of this problem statement?  
The primary goals are to simplify trip planning, reduce manual effort, enable flexible customization, improve decision-making, and support smooth coordination throughout the travel journey.

• List key terms used by the domain expert and their meanings 
| Term | Meaning as explained by the expert |
|---|---|
| API | A software interface that allows systems to exchange travel-related data and services |
| Itinerary | A detailed plan of a trip including destinations, dates, activities, accommodation, and transport |
| Travel Package | A bundled travel plan combining multiple travel services |

## Actors and Responsibilities

• Identify the different roles involved and what they do in practice.

| Actor / Role | Responsibilities |
|---|---|
| Traveler | Plans, customizes, coordinates, and executes travel itineraries |
| Local Guide | Assists travellers with guided experiences and local knowledge |
| Service Partner | Provides accommodation, transport, and activity services |
| Admin | Manages platform operations, users, policies, and service coordination |

## Core workflows

Description of at least 2-3 real workflows as explained by the domain expert

### • Workflow 1  
  ####  Trigger/start condition:  
   - User wants to plan a trip  
  #### Steps involved :  
   - User enters travel preferences such as destination, dates, number of travellers, budget, and interests  
   - System generates recommended itineraries or travel packages  
   - User reviews the recommendations  
   -  User shortlists a package or proceeds to customization  
  #### Outcome / End condition:  
   - A draft or shortlisted itinerary is created  

### • Workflow 2  
  #### Trigger/start condition:  
   - User selects a recommended itinerary to modify  
  #### Steps involved :  
   - User adds, removes, or edits destinations and services  
  -  System recalculates cost and schedule dynamically  
   - User chooses between self-managed or partner-managed services  
   - User finalizes the itinerary  
  #### Outcome / End condition:  
   - A confirmed travel itinerary is created  

### • Workflow 3  
  #### Trigger/start condition:  
  -  Multiple travellers plan a shared trip  
#### Steps involved : 
  -  Compatibility parameters are applied to identify suitable co-travellers  
   - Cost sharing and coordination mechanisms are enabled  
   - Identity and contact verification is performed  
   - Changes such as traveller drop-outs are handled  
  ####  Outcome / End condition:  
   - A coordinated group itinerary is finalized  

## Rules, Constraints, and Exceptions

Document rules that govern how the domain operates.

- ### Mandatory rules or policies:  
  Destination, travel dates, and number of travellers must be finalized before booking  
  Identity verification is mandatory for shared or group travel  
  Payments and cancellations follow service partner policies  
  Major itinerary changes after trip start are limited  

- ### Constraints or limitations:  
  Platform must remain simple while handling complex workflows  
  Availability and pricing depend on third-party service partners  
  Legal requirements for data privacy and payment security must be followed  
  User constraints such as kid restrictions and safety considerations must be supported  

- ### Common exceptions or edge cases:  
  Last-minute itinerary changes or cancellations  
  Traveller dropping out of a group trip  
  Service unavailability due to weather or overbooking  

- ### Situations where things usually go wrong:  
  Miscommunication between travellers and service providers  
  Incorrect assumptions about service availability or pricing  
  Delays caused by manual coordination  
  Lack of real-time updates during trip execution  

## Current challenges and pain points

#### • What parts of this process are most difficult or inefficient?  
Trip planning requires significant manual effort, especially for unfamiliar destinations and group travel.

#### • Where do delays, errors, or misunderstandings usually occur?  
Delays and misunderstandings occur during itinerary customization, service confirmation, and coordination between multiple parties.

#### • What information is hardest to track or manage today?  
Tracking itinerary changes, confirmations, exceptions, and real-time updates is difficult due to lack of centralized visibility.
## Structured Input Parameters for Recommendations

The platform uses structured input parameters to generate reusable and generic travel recommendations. These parameters help standardize recommendation logic and improve consistency across different travel scenarios.

- Destination  
- Purpose of travel (e.g., pilgrimage, leisure)  
- Duration  
- Type of trip  
- Budget  
- Time of the year  

These parameters can be represented in configuration files such as YAML to support flexible, reusable, and scalable recommendation logic.

## Technology and Intelligence Considerations

- The quality of LLM training directly impacts the accuracy and relevance of travel recommendations  
- Strong third-party APIs should be integrated to enhance data reliability and contextual awareness, such as:
  - MakeMyTrip for travel and pricing data
  - Instagram for experiential and contextual insights
- Item-level itinerary customization should maintain an audit history to improve future recommendations  
- Date changes and context-aware suggestions should be handled intelligently to reflect real-world travel conditions


## Assumptions & Clarifications

#### • What assumptions made by the team that were confirmed  
Travellers prefer flexible and customizable trip planning.  
Users struggle when planning trips to unfamiliar destinations.  
Group travel introduces additional coordination complexity.

#### • What assumptions that were corrected  
Not all travellers want full automation; many prefer control over final decisions.  
Cost sharing and group travel require clear rules and trust mechanisms.

## Open questions that need follow-up need be to in this format  
1. How much automation do users trust in travel planning?  
2. What level of responsibility should the platform take during trip execution?  
3. How should disputes or conflicts between travellers be handled?


