--
-- PostgreSQL database dump
--

\restrict JIvOnxEZHgIrYHIcUelTXElUe5PZfyus9ietGPfExSeenewGGurusUj8jnory7m

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

-- Started on 2026-09-08 13:24:57

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 239 (class 1255 OID 16586)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16604)
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    admin_id integer NOT NULL,
    user_id integer NOT NULL,
    full_name character varying(150) NOT NULL,
    access_level character varying(20) NOT NULL,
    CONSTRAINT chk_admins_access_level CHECK (((access_level)::text = ANY ((ARRAY['standard'::character varying, 'master'::character varying])::text[])))
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16603)
-- Name: admins_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_admin_id_seq OWNER TO postgres;

--
-- TOC entry 5055 (class 0 OID 0)
-- Dependencies: 219
-- Name: admins_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_admin_id_seq OWNED BY public.admins.admin_id;


--
-- TOC entry 232 (class 1259 OID 16693)
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_records (
    record_id integer NOT NULL,
    learner_id integer NOT NULL,
    teacher_id integer NOT NULL,
    record_date date NOT NULL,
    time_in time without time zone,
    status character varying(10) NOT NULL,
    CONSTRAINT chk_attendance_status CHECK (((status)::text = ANY ((ARRAY['present'::character varying, 'absent'::character varying])::text[])))
);


ALTER TABLE public.attendance_records OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16692)
-- Name: attendance_records_record_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_records_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_records_record_id_seq OWNER TO postgres;

--
-- TOC entry 5056 (class 0 OID 0)
-- Dependencies: 231
-- Name: attendance_records_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_records_record_id_seq OWNED BY public.attendance_records.record_id;


--
-- TOC entry 234 (class 1259 OID 16716)
-- Name: development_observations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.development_observations (
    observation_id integer NOT NULL,
    learner_id integer NOT NULL,
    teacher_id integer NOT NULL,
    record_date date NOT NULL,
    category character varying(100) NOT NULL,
    rating smallint NOT NULL,
    notes text,
    CONSTRAINT chk_observation_rating CHECK (((rating >= 1) AND (rating <= 10)))
);


ALTER TABLE public.development_observations OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16715)
-- Name: development_observations_observation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.development_observations_observation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.development_observations_observation_id_seq OWNER TO postgres;

--
-- TOC entry 5057 (class 0 OID 0)
-- Dependencies: 233
-- Name: development_observations_observation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.development_observations_observation_id_seq OWNED BY public.development_observations.observation_id;


--
-- TOC entry 226 (class 1259 OID 16650)
-- Name: guardians; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guardians (
    guardian_id integer NOT NULL,
    user_id integer NOT NULL,
    full_name character varying(150) NOT NULL,
    contact_number character varying(30) NOT NULL,
    relationship character varying(50) NOT NULL
);


ALTER TABLE public.guardians OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16649)
-- Name: guardians_guardian_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.guardians_guardian_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guardians_guardian_id_seq OWNER TO postgres;

--
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 225
-- Name: guardians_guardian_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.guardians_guardian_id_seq OWNED BY public.guardians.guardian_id;


--
-- TOC entry 230 (class 1259 OID 16678)
-- Name: learners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.learners (
    learner_id integer NOT NULL,
    class_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    date_of_birth date NOT NULL,
    can_walk_home_alone boolean DEFAULT false NOT NULL
);


ALTER TABLE public.learners OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16677)
-- Name: learners_learner_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.learners_learner_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.learners_learner_id_seq OWNER TO postgres;

--
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 229
-- Name: learners_learner_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.learners_learner_id_seq OWNED BY public.learners.learner_id;


--
-- TOC entry 222 (class 1259 OID 16620)
-- Name: managers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.managers (
    manager_id integer NOT NULL,
    user_id integer NOT NULL,
    full_name character varying(150) NOT NULL
);


ALTER TABLE public.managers OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16619)
-- Name: managers_manager_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.managers_manager_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.managers_manager_id_seq OWNER TO postgres;

--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 221
-- Name: managers_manager_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.managers_manager_id_seq OWNED BY public.managers.manager_id;


--
-- TOC entry 236 (class 1259 OID 16738)
-- Name: pickup_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pickup_permissions (
    permission_id integer NOT NULL,
    learner_id integer NOT NULL,
    guardian_id integer NOT NULL,
    is_primary_contact boolean DEFAULT false NOT NULL,
    authorised_date date DEFAULT CURRENT_DATE NOT NULL
);


ALTER TABLE public.pickup_permissions OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16737)
-- Name: pickup_permissions_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pickup_permissions_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pickup_permissions_permission_id_seq OWNER TO postgres;

--
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 235
-- Name: pickup_permissions_permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pickup_permissions_permission_id_seq OWNED BY public.pickup_permissions.permission_id;


--
-- TOC entry 228 (class 1259 OID 16665)
-- Name: school_classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.school_classes (
    class_id integer NOT NULL,
    teacher_id integer NOT NULL,
    class_name character varying(100) NOT NULL,
    grade_range character varying(50) NOT NULL
);


ALTER TABLE public.school_classes OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16664)
-- Name: school_classes_class_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.school_classes_class_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.school_classes_class_id_seq OWNER TO postgres;

--
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 227
-- Name: school_classes_class_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.school_classes_class_id_seq OWNED BY public.school_classes.class_id;


--
-- TOC entry 238 (class 1259 OID 16761)
-- Name: sign_out_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sign_out_records (
    record_id integer NOT NULL,
    learner_id integer NOT NULL,
    teacher_id integer NOT NULL,
    guardian_id integer,
    record_date date NOT NULL,
    time_out time without time zone NOT NULL
);


ALTER TABLE public.sign_out_records OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16760)
-- Name: sign_out_records_record_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sign_out_records_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sign_out_records_record_id_seq OWNER TO postgres;

--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 237
-- Name: sign_out_records_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sign_out_records_record_id_seq OWNED BY public.sign_out_records.record_id;


--
-- TOC entry 224 (class 1259 OID 16635)
-- Name: teachers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teachers (
    teacher_id integer NOT NULL,
    user_id integer NOT NULL,
    full_name character varying(150) NOT NULL,
    contact_email character varying(255) NOT NULL
);


ALTER TABLE public.teachers OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16634)
-- Name: teachers_teacher_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teachers_teacher_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teachers_teacher_id_seq OWNER TO postgres;

--
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 223
-- Name: teachers_teacher_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teachers_teacher_id_seq OWNED BY public.teachers.teacher_id;


--
-- TOC entry 218 (class 1259 OID 16588)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    full_name character varying(150) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_users_role CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying, 'teacher'::character varying, 'guardian'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16587)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4796 (class 2604 OID 16607)
-- Name: admins admin_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN admin_id SET DEFAULT nextval('public.admins_admin_id_seq'::regclass);


--
-- TOC entry 4803 (class 2604 OID 16696)
-- Name: attendance_records record_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records ALTER COLUMN record_id SET DEFAULT nextval('public.attendance_records_record_id_seq'::regclass);


--
-- TOC entry 4804 (class 2604 OID 16719)
-- Name: development_observations observation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.development_observations ALTER COLUMN observation_id SET DEFAULT nextval('public.development_observations_observation_id_seq'::regclass);


--
-- TOC entry 4799 (class 2604 OID 16653)
-- Name: guardians guardian_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guardians ALTER COLUMN guardian_id SET DEFAULT nextval('public.guardians_guardian_id_seq'::regclass);


--
-- TOC entry 4801 (class 2604 OID 16681)
-- Name: learners learner_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learners ALTER COLUMN learner_id SET DEFAULT nextval('public.learners_learner_id_seq'::regclass);


--
-- TOC entry 4797 (class 2604 OID 16623)
-- Name: managers manager_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers ALTER COLUMN manager_id SET DEFAULT nextval('public.managers_manager_id_seq'::regclass);


--
-- TOC entry 4805 (class 2604 OID 16741)
-- Name: pickup_permissions permission_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pickup_permissions ALTER COLUMN permission_id SET DEFAULT nextval('public.pickup_permissions_permission_id_seq'::regclass);


--
-- TOC entry 4800 (class 2604 OID 16668)
-- Name: school_classes class_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_classes ALTER COLUMN class_id SET DEFAULT nextval('public.school_classes_class_id_seq'::regclass);


--
-- TOC entry 4808 (class 2604 OID 16764)
-- Name: sign_out_records record_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sign_out_records ALTER COLUMN record_id SET DEFAULT nextval('public.sign_out_records_record_id_seq'::regclass);


--
-- TOC entry 4798 (class 2604 OID 16638)
-- Name: teachers teacher_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers ALTER COLUMN teacher_id SET DEFAULT nextval('public.teachers_teacher_id_seq'::regclass);


--
-- TOC entry 4793 (class 2604 OID 16591)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 4819 (class 2606 OID 16610)
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (admin_id);


--
-- TOC entry 4821 (class 2606 OID 16612)
-- Name: admins admins_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_user_id_key UNIQUE (user_id);


--
-- TOC entry 4846 (class 2606 OID 16699)
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (record_id);


--
-- TOC entry 4853 (class 2606 OID 16724)
-- Name: development_observations development_observations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.development_observations
    ADD CONSTRAINT development_observations_pkey PRIMARY KEY (observation_id);


--
-- TOC entry 4834 (class 2606 OID 16655)
-- Name: guardians guardians_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_pkey PRIMARY KEY (guardian_id);


--
-- TOC entry 4836 (class 2606 OID 16657)
-- Name: guardians guardians_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_user_id_key UNIQUE (user_id);


--
-- TOC entry 4844 (class 2606 OID 16684)
-- Name: learners learners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learners
    ADD CONSTRAINT learners_pkey PRIMARY KEY (learner_id);


--
-- TOC entry 4825 (class 2606 OID 16625)
-- Name: managers managers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_pkey PRIMARY KEY (manager_id);


--
-- TOC entry 4827 (class 2606 OID 16627)
-- Name: managers managers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_user_id_key UNIQUE (user_id);


--
-- TOC entry 4859 (class 2606 OID 16745)
-- Name: pickup_permissions pickup_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pickup_permissions
    ADD CONSTRAINT pickup_permissions_pkey PRIMARY KEY (permission_id);


--
-- TOC entry 4840 (class 2606 OID 16670)
-- Name: school_classes school_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_classes
    ADD CONSTRAINT school_classes_pkey PRIMARY KEY (class_id);


--
-- TOC entry 4866 (class 2606 OID 16766)
-- Name: sign_out_records sign_out_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sign_out_records
    ADD CONSTRAINT sign_out_records_pkey PRIMARY KEY (record_id);


--
-- TOC entry 4830 (class 2606 OID 16640)
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (teacher_id);


--
-- TOC entry 4832 (class 2606 OID 16642)
-- Name: teachers teachers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_key UNIQUE (user_id);


--
-- TOC entry 4851 (class 2606 OID 16701)
-- Name: attendance_records uq_attendance_learner_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT uq_attendance_learner_date UNIQUE (learner_id, record_date);


--
-- TOC entry 4861 (class 2606 OID 16747)
-- Name: pickup_permissions uq_pickup_learner_guardian; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pickup_permissions
    ADD CONSTRAINT uq_pickup_learner_guardian UNIQUE (learner_id, guardian_id);


--
-- TOC entry 4815 (class 2606 OID 16600)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4817 (class 2606 OID 16598)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4822 (class 1259 OID 16618)
-- Name: idx_admins_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admins_user_id ON public.admins USING btree (user_id);


--
-- TOC entry 4847 (class 1259 OID 16712)
-- Name: idx_attendance_learner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_learner_id ON public.attendance_records USING btree (learner_id);


--
-- TOC entry 4848 (class 1259 OID 16714)
-- Name: idx_attendance_record_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_record_date ON public.attendance_records USING btree (record_date);


--
-- TOC entry 4849 (class 1259 OID 16713)
-- Name: idx_attendance_teacher_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_teacher_id ON public.attendance_records USING btree (teacher_id);


--
-- TOC entry 4837 (class 1259 OID 16663)
-- Name: idx_guardians_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guardians_user_id ON public.guardians USING btree (user_id);


--
-- TOC entry 4841 (class 1259 OID 16690)
-- Name: idx_learners_class_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_learners_class_id ON public.learners USING btree (class_id);


--
-- TOC entry 4842 (class 1259 OID 16691)
-- Name: idx_learners_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_learners_name ON public.learners USING btree (last_name, first_name);


--
-- TOC entry 4823 (class 1259 OID 16633)
-- Name: idx_managers_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_managers_user_id ON public.managers USING btree (user_id);


--
-- TOC entry 4854 (class 1259 OID 16735)
-- Name: idx_observations_learner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observations_learner_id ON public.development_observations USING btree (learner_id);


--
-- TOC entry 4855 (class 1259 OID 16736)
-- Name: idx_observations_teacher_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_observations_teacher_id ON public.development_observations USING btree (teacher_id);


--
-- TOC entry 4856 (class 1259 OID 16759)
-- Name: idx_pickup_guardian_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pickup_guardian_id ON public.pickup_permissions USING btree (guardian_id);


--
-- TOC entry 4857 (class 1259 OID 16758)
-- Name: idx_pickup_learner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pickup_learner_id ON public.pickup_permissions USING btree (learner_id);


--
-- TOC entry 4838 (class 1259 OID 16676)
-- Name: idx_school_classes_teacher_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_school_classes_teacher_id ON public.school_classes USING btree (teacher_id);


--
-- TOC entry 4862 (class 1259 OID 16782)
-- Name: idx_signout_learner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signout_learner_id ON public.sign_out_records USING btree (learner_id);


--
-- TOC entry 4863 (class 1259 OID 16784)
-- Name: idx_signout_record_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signout_record_date ON public.sign_out_records USING btree (record_date);


--
-- TOC entry 4864 (class 1259 OID 16783)
-- Name: idx_signout_teacher_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_signout_teacher_id ON public.sign_out_records USING btree (teacher_id);


--
-- TOC entry 4828 (class 1259 OID 16648)
-- Name: idx_teachers_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teachers_user_id ON public.teachers USING btree (user_id);


--
-- TOC entry 4813 (class 1259 OID 16601)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4882 (class 2620 OID 16602)
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 4867 (class 2606 OID 16613)
-- Name: admins admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4873 (class 2606 OID 16702)
-- Name: attendance_records attendance_records_learner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.learners(learner_id) ON DELETE CASCADE;


--
-- TOC entry 4874 (class 2606 OID 16707)
-- Name: attendance_records attendance_records_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(teacher_id) ON DELETE RESTRICT;


--
-- TOC entry 4875 (class 2606 OID 16725)
-- Name: development_observations development_observations_learner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.development_observations
    ADD CONSTRAINT development_observations_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.learners(learner_id) ON DELETE CASCADE;


--
-- TOC entry 4876 (class 2606 OID 16730)
-- Name: development_observations development_observations_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.development_observations
    ADD CONSTRAINT development_observations_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(teacher_id) ON DELETE RESTRICT;


--
-- TOC entry 4870 (class 2606 OID 16658)
-- Name: guardians guardians_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4872 (class 2606 OID 16685)
-- Name: learners learners_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learners
    ADD CONSTRAINT learners_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.school_classes(class_id) ON DELETE RESTRICT;


--
-- TOC entry 4868 (class 2606 OID 16628)
-- Name: managers managers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4877 (class 2606 OID 16753)
-- Name: pickup_permissions pickup_permissions_guardian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pickup_permissions
    ADD CONSTRAINT pickup_permissions_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.guardians(guardian_id) ON DELETE CASCADE;


--
-- TOC entry 4878 (class 2606 OID 16748)
-- Name: pickup_permissions pickup_permissions_learner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pickup_permissions
    ADD CONSTRAINT pickup_permissions_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.learners(learner_id) ON DELETE CASCADE;


--
-- TOC entry 4871 (class 2606 OID 16671)
-- Name: school_classes school_classes_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_classes
    ADD CONSTRAINT school_classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(teacher_id) ON DELETE RESTRICT;


--
-- TOC entry 4879 (class 2606 OID 16777)
-- Name: sign_out_records sign_out_records_guardian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sign_out_records
    ADD CONSTRAINT sign_out_records_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.guardians(guardian_id) ON DELETE RESTRICT;


--
-- TOC entry 4880 (class 2606 OID 16767)
-- Name: sign_out_records sign_out_records_learner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sign_out_records
    ADD CONSTRAINT sign_out_records_learner_id_fkey FOREIGN KEY (learner_id) REFERENCES public.learners(learner_id) ON DELETE CASCADE;


--
-- TOC entry 4881 (class 2606 OID 16772)
-- Name: sign_out_records sign_out_records_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sign_out_records
    ADD CONSTRAINT sign_out_records_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(teacher_id) ON DELETE RESTRICT;


--
-- TOC entry 4869 (class 2606 OID 16643)
-- Name: teachers teachers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Migration 005: donor_reports
-- Corresponds to ERD/Design Class Diagram: DONOR_REPORT
-- Generated by 1 Manager; captures metadata for exported PDF reports
-- (see Sequence Diagram: Donor Report Generation, Figure 11)
-- Ref: Imizamo Yethu Aftercare Management System, Part 1 submission
--
-- NOTE: No file storage column (e.g. pdf_path/blob) is included, matching
-- the Part 1 design — generatePDF()/exportChart() are documented as
-- methods, not stored attributes. This table only stores report metadata.
--

--
-- Name: donor_reports_report_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.donor_reports_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.donor_reports_report_id_seq OWNER TO postgres;

--
-- Name: donor_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donor_reports (
    report_id integer NOT NULL DEFAULT nextval('public.donor_reports_report_id_seq'),
    manager_id integer NOT NULL,
    date_generated timestamp with time zone NOT NULL DEFAULT now(),
    period_start date NOT NULL,
    period_end date NOT NULL,
    CONSTRAINT chk_donor_report_period CHECK (period_end >= period_start)
);


ALTER TABLE public.donor_reports OWNER TO postgres;

ALTER SEQUENCE public.donor_reports_report_id_seq OWNED BY public.donor_reports.report_id;

--
-- Name: donor_reports donor_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donor_reports
    ADD CONSTRAINT donor_reports_pkey PRIMARY KEY (report_id);

--
-- Name: idx_donor_reports_manager_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_donor_reports_manager_id ON public.donor_reports USING btree (manager_id);

--
-- Name: idx_donor_reports_date_generated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_donor_reports_date_generated ON public.donor_reports USING btree (date_generated);

--
-- Name: donor_reports donor_reports_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donor_reports
    ADD CONSTRAINT donor_reports_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.managers(manager_id) ON DELETE RESTRICT;

-- Add a new column to the users table to indicate if the user is active
ALTER TABLE users ADD COLUMN is_active boolean NOT NULL DEFAULT true;

---------------------------------------------------------------------------------------------------------
-- ===== alter for the class_management.sql =====

-- Manager-created classes can start with no teacher (Unassigned)
ALTER TABLE school_classes
  ALTER COLUMN teacher_id DROP NOT NULL;

-- Soft-deactivate flag
ALTER TABLE school_classes
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- One ACTIVE class per name (case-insensitive). A class's colour is its
-- name, so this also means one active Blue, one active Yellow, and so on.
CREATE UNIQUE INDEX uq_school_classes_active_name
  ON school_classes (LOWER(class_name))
  WHERE is_active;

-- Seed the five real classes (teachers get assigned later).
-- Grade ranges are placeholders: check them against the spreadsheet.
INSERT INTO school_classes (class_name, grade_range, teacher_id)
SELECT v.name, v.grade, NULL
FROM (VALUES
  ('Yellow', 'Gr 1-2'),
  ('Green',  'Gr 3-4'),
  ('Red',    'Gr 5-6'),
  ('Blue',   'Gr 7'),
  ('Orange', 'Gr R')
) AS v(name, grade)
WHERE NOT EXISTS (
  SELECT 1 FROM school_classes c
  WHERE LOWER(c.class_name) = LOWER(v.name) AND c.is_active
);



-- ===== alter for the guardian_learner_claim.sql =====

-- What the parent typed at signup, so the manager knows which learner to
-- link them to. Plain text only: NOT a foreign key and NOT access.
-- Access still comes only from pickup_permissions.
ALTER TABLE guardians
  ADD COLUMN claimed_learner_name VARCHAR(200),
  ADD COLUMN claimed_learner_dob  DATE;

ALTER TABLE learners
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
--Will only deactivate a class if there are no active learners in it

-- DOWN (rollback): DROP TABLE IF EXISTS public.donor_reports;


-- Completed on 2026-09-08 13:24:57

--
-- PostgreSQL database dump complete
--

\unrestrict JIvOnxEZHgIrYHIcUelTXElUe5PZfyus9ietGPfExSeenewGGurusUj8jnory7m