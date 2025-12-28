const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    ratio: String,
    url: String,
    width: Number,
    height: Number,
    fallback: Boolean
}, { _id: false });

const GenreSchema = new mongoose.Schema({
    id: String,
    name: String
}, { _id: false });

const ClassificationSchema = new mongoose.Schema({
    primary: Boolean,
    segment: GenreSchema,
    genre: GenreSchema,
    subGenre: GenreSchema
}, { _id: false });

const StartSchema = new mongoose.Schema({
    localDate: String,
    dateTBD: Boolean,
    dateTBA: Boolean,
    timeTBA: Boolean,
    noSpecificTime: Boolean
}, { _id: false });

const StatusSchema = new mongoose.Schema({
    code: String
}, { _id: false });

const DatesSchema = new mongoose.Schema({
    start: StartSchema,
    timezone: String,
    status: StatusSchema
}, { _id: false });

const AddressSchema = new mongoose.Schema({
    line1: String
}, { _id: false });

const CitySchema = new mongoose.Schema({ name: String }, { _id: false });
const StateSchema = new mongoose.Schema({ name: String, stateCode: String }, { _id: false });
const CountrySchema = new mongoose.Schema({ name: String, countryCode: String }, { _id: false });
const LocationSchema = new mongoose.Schema({ latitude: String, longitude: String }, { _id: false });

const VenueSchema = new mongoose.Schema({
    name: String,
    type: String,
    id: String,
    test: Boolean,
    locale: String,
    postalCode: String,
    timezone: String,
    city: CitySchema,
    state: StateSchema,
    country: CountrySchema,
    address: AddressSchema,
    location: LocationSchema,
    images: [ImageSchema]
}, { _id: false });

const AttractionSchema = new mongoose.Schema({
    name: String,
    type: String,
    id: String,
    test: Boolean,
    locale: String,
    images: [ImageSchema],
    classifications: [ClassificationSchema]
}, { _id: false });

const EmbeddedSchema = new mongoose.Schema({
    venues: [VenueSchema],
    attractions: [AttractionSchema]
}, { _id: false });

const SalesPublicSchema = new mongoose.Schema({
    startDateTime: Date,
    startTBD: Boolean,
    endDateTime: Date
}, { _id: false });

const SalesSchema = new mongoose.Schema({ public: SalesPublicSchema }, { _id: false });

const EventSchema = new mongoose.Schema({
    name: String,
    type: String,
    id: { type: String, index: true },
    test: Boolean,
    url: String,
    locale: String,
    images: [ImageSchema],
    sales: SalesSchema,
    dates: DatesSchema,
    classifications: [ClassificationSchema],
    promoter: mongoose.Schema.Types.Mixed,
    links: mongoose.Schema.Types.Mixed,
    _embedded: EmbeddedSchema
}, { timestamps: true });

const EventModel = mongoose.model('Favorites', EventSchema);
module.exports = EventModel;
