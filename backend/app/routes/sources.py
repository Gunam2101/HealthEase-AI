from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/sources", tags=["Trusted Health Resources"])

class TrustedResource(BaseModel):
    id: str
    name: str
    organization: str
    description: str
    website_url: str
    topics_covered: List[str]
    badge: str

TRUSTED_SOURCES_DATA: List[TrustedResource] = [
    TrustedResource(
        id="who",
        name="World Health Organization (WHO)",
        organization="United Nations Specialized Agency for International Public Health",
        description="Global health standards, international epidemiological bulletins, disease prevention frameworks, and clinical management guidelines.",
        website_url="https://www.who.int",
        topics_covered=["Cardiovascular Health", "Infectious Diseases", "Global Health Standards", "Nutrition"],
        badge="Global Standard"
    ),
    TrustedResource(
        id="medlineplus",
        name="MedlinePlus (National Library of Medicine / NIH)",
        organization="U.S. National Institutes of Health",
        description="Peer-reviewed consumer health literacy database detailing conditions, medical tests, medications, supplements, and wellness topics in plain, accessible language.",
        website_url="https://medlineplus.gov",
        topics_covered=["Medical Terms", "Laboratory Tests", "Prescription & OTC Drugs", "Anatomy"],
        badge="Peer-Reviewed"
    ),
    TrustedResource(
        id="cdc",
        name="Centers for Disease Control and Prevention (CDC)",
        organization="U.S. Department of Health and Human Services",
        description="Evidence-based guidance on chronic disease prevention, vaccination schedules, infection control, and healthy lifestyle interventions.",
        website_url="https://www.cdc.gov",
        topics_covered=["Preventive Care", "Diabetes Prevention", "Heart Disease & Stroke", "Sleep Health"],
        badge="Evidence-Based"
    ),
    TrustedResource(
        id="nhs",
        name="National Health Service (NHS Health A-Z)",
        organization="United Kingdom Public Health Service",
        description="Comprehensive clinical health guides covering symptoms, treatments, self-care recommendations, and patient guidance validated by clinical practitioners.",
        website_url="https://www.nhs.uk/conditions",
        topics_covered=["Symptom Guides", "Medicines A to Z", "Emergency Care Guidance", "Mental Wellbeing"],
        badge="Clinical Service"
    )
]

@router.get("", response_model=List[TrustedResource])
def get_trusted_sources():
    return TRUSTED_SOURCES_DATA
