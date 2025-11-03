--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-07-26 16:44:55

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

DROP DATABASE IF EXISTS ecommerce;
--
-- TOC entry 5547 (class 1262 OID 59992)
-- Name: ecommerce; Type: DATABASE; Schema: -; Owner: tanmay
--

CREATE DATABASE ecommerce WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en-US';


ALTER DATABASE ecommerce OWNER TO tanmay;

\connect ecommerce

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
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 5548 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 244 (class 1259 OID 66966)
-- Name: admin_activities; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.admin_activities (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    action character varying NOT NULL,
    resource_type character varying,
    resource_id character varying,
    description text,
    ip_address character varying,
    user_agent character varying,
    activity_metadata json,
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.admin_activities OWNER TO tanmay;

--
-- TOC entry 257 (class 1259 OID 67427)
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO tanmay;

--
-- TOC entry 256 (class 1259 OID 67270)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    user_id uuid,
    action character varying,
    entity_type character varying,
    entity_id character varying,
    resource_type character varying(100),
    resource_id character varying(200),
    details text,
    old_values json,
    new_values json,
    ip_address character varying,
    user_agent character varying,
    "timestamp" timestamp with time zone DEFAULT now(),
    session_id character varying(100),
    request_id character varying(100)
);


ALTER TABLE public.audit_logs OWNER TO tanmay;

--
-- TOC entry 240 (class 1259 OID 66324)
-- Name: cart_item; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.cart_item (
    id uuid NOT NULL,
    cart_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    added_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.cart_item OWNER TO tanmay;

--
-- TOC entry 235 (class 1259 OID 60963)
-- Name: cart_items; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.cart_items (
    cart_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer,
    added_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.cart_items OWNER TO tanmay;

--
-- TOC entry 232 (class 1259 OID 60910)
-- Name: carts; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.carts (
    id uuid NOT NULL,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.carts OWNER TO tanmay;

--
-- TOC entry 226 (class 1259 OID 60838)
-- Name: currencies; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.currencies (
    id integer NOT NULL,
    code character varying(3) NOT NULL,
    name character varying NOT NULL,
    symbol character varying NOT NULL,
    exchange_rate numeric(10,6),
    is_base boolean,
    is_active boolean,
    updated_at timestamp with time zone
);


ALTER TABLE public.currencies OWNER TO tanmay;

--
-- TOC entry 225 (class 1259 OID 60837)
-- Name: currencies_id_seq; Type: SEQUENCE; Schema: public; Owner: tanmay
--

CREATE SEQUENCE public.currencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.currencies_id_seq OWNER TO tanmay;

--
-- TOC entry 5549 (class 0 OID 0)
-- Dependencies: 225
-- Name: currencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tanmay
--

ALTER SEQUENCE public.currencies_id_seq OWNED BY public.currencies.id;


--
-- TOC entry 251 (class 1259 OID 67016)
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.feature_flags (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    is_enabled boolean NOT NULL,
    rollout_percentage integer,
    target_groups json,
    conditions json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    created_by integer,
    updated_by integer,
    expires_at timestamp with time zone
);


ALTER TABLE public.feature_flags OWNER TO tanmay;

--
-- TOC entry 250 (class 1259 OID 67015)
-- Name: feature_flags_id_seq; Type: SEQUENCE; Schema: public; Owner: tanmay
--

CREATE SEQUENCE public.feature_flags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feature_flags_id_seq OWNER TO tanmay;

--
-- TOC entry 5550 (class 0 OID 0)
-- Dependencies: 250
-- Name: feature_flags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tanmay
--

ALTER SEQUENCE public.feature_flags_id_seq OWNED BY public.feature_flags.id;


--
-- TOC entry 267 (class 1259 OID 67591)
-- Name: inventory_forecasts; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.inventory_forecasts (
    id uuid NOT NULL,
    product_id uuid,
    forecast_period_days integer,
    predicted_demand integer,
    confidence_interval_lower integer,
    confidence_interval_upper integer,
    current_stock integer,
    recommended_order_quantity integer,
    stockout_probability numeric(5,4),
    seasonal_factor numeric(5,4),
    trend_factor numeric(5,4),
    forecast_accuracy numeric(5,4),
    model_used character varying(50),
    forecast_date date,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inventory_forecasts OWNER TO tanmay;

--
-- TOC entry 228 (class 1259 OID 60850)
-- Name: languages; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.languages (
    id integer NOT NULL,
    code character varying(5) NOT NULL,
    name character varying NOT NULL,
    native_name character varying NOT NULL,
    is_active boolean,
    is_default boolean
);


ALTER TABLE public.languages OWNER TO tanmay;

--
-- TOC entry 227 (class 1259 OID 60849)
-- Name: languages_id_seq; Type: SEQUENCE; Schema: public; Owner: tanmay
--

CREATE SEQUENCE public.languages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.languages_id_seq OWNER TO tanmay;

--
-- TOC entry 5551 (class 0 OID 0)
-- Dependencies: 227
-- Name: languages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tanmay
--

ALTER SEQUENCE public.languages_id_seq OWNED BY public.languages.id;


--
-- TOC entry 224 (class 1259 OID 60827)
-- Name: logs; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.logs (
    id uuid NOT NULL,
    level character varying NOT NULL,
    logger_name character varying NOT NULL,
    message text NOT NULL,
    module character varying,
    function_name character varying,
    line_number integer,
    exception text,
    extra_data json,
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.logs OWNER TO tanmay;

--
-- TOC entry 258 (class 1259 OID 67432)
-- Name: ml_model_configs; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.ml_model_configs (
    id uuid NOT NULL,
    model_name character varying(100) NOT NULL,
    model_type character varying(50) NOT NULL,
    parameters jsonb NOT NULL,
    is_active boolean,
    training_schedule character varying(50),
    performance_threshold numeric(5,4),
    last_trained_at timestamp with time zone,
    next_training_at timestamp with time zone,
    model_version character varying(50),
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE public.ml_model_configs OWNER TO tanmay;

--
-- TOC entry 259 (class 1259 OID 67452)
-- Name: model_training_history; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.model_training_history (
    id uuid NOT NULL,
    model_config_id uuid,
    training_status character varying(50),
    training_metrics jsonb,
    training_parameters jsonb,
    error_message text,
    training_data_stats jsonb,
    model_performance jsonb,
    training_duration_seconds integer,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    initiated_by uuid
);


ALTER TABLE public.model_training_history OWNER TO tanmay;

--
-- TOC entry 234 (class 1259 OID 60950)
-- Name: notifications; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    user_id uuid,
    type character varying NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    data json,
    is_read boolean,
    is_sent boolean,
    scheduled_for timestamp with time zone,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO tanmay;

--
-- TOC entry 238 (class 1259 OID 61010)
-- Name: order_items; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.order_items (
    id uuid NOT NULL,
    order_id uuid,
    product_id uuid,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL
);


ALTER TABLE public.order_items OWNER TO tanmay;

--
-- TOC entry 233 (class 1259 OID 60923)
-- Name: orders; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.orders (
    id uuid NOT NULL,
    user_id uuid,
    order_number character varying,
    status character varying,
    total_amount numeric(10,2) NOT NULL,
    currency character varying,
    shipping_address json,
    billing_address json,
    shipping_method character varying,
    estimated_delivery timestamp with time zone,
    payment_method character varying,
    payment_status character varying,
    tracking_number character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.orders OWNER TO tanmay;

--
-- TOC entry 222 (class 1259 OID 60801)
-- Name: permissions; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.permissions OWNER TO tanmay;

--
-- TOC entry 221 (class 1259 OID 60800)
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: tanmay
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO tanmay;

--
-- TOC entry 5552 (class 0 OID 0)
-- Dependencies: 221
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tanmay
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- TOC entry 223 (class 1259 OID 60813)
-- Name: product_categories; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.product_categories (
    id uuid NOT NULL,
    name character varying NOT NULL,
    description text,
    parent_id uuid,
    is_active boolean,
    display_order integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.product_categories OWNER TO tanmay;

--
-- TOC entry 237 (class 1259 OID 60995)
-- Name: product_config; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.product_config (
    id uuid NOT NULL,
    product_id uuid,
    show_in_search boolean,
    show_in_recommendations boolean,
    reranking_priority integer,
    is_sponsored boolean,
    sponsored_priority integer,
    featured boolean,
    promotion_text character varying,
    boost_factor double precision,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.product_config OWNER TO tanmay;

--
-- TOC entry 231 (class 1259 OID 60891)
-- Name: products; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.products (
    id uuid NOT NULL,
    name character varying NOT NULL,
    category_id uuid,
    brand character varying,
    price numeric(10,2) NOT NULL,
    code character varying,
    description text,
    specification text,
    technical_details text,
    product_dimensions character varying,
    images character varying[],
    product_url character varying,
    is_amazon_seller boolean,
    is_active boolean,
    stock_quantity integer,
    in_stock boolean,
    is_embedding_generated boolean,
    embedding public.vector(384),
    custom_fields json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    meta_title character varying,
    meta_description text,
    tags character varying[]
);


ALTER TABLE public.products OWNER TO tanmay;

--
-- TOC entry 265 (class 1259 OID 67554)
-- Name: recommendation_conversions; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.recommendation_conversions (
    id uuid NOT NULL,
    user_id uuid,
    session_id character varying(100),
    recommendation_request_id character varying(100),
    recommended_products jsonb,
    interactions jsonb,
    final_conversion jsonb,
    conversion_value numeric(10,2),
    time_to_conversion_minutes integer,
    conversion_funnel jsonb,
    a_b_test_variant character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.recommendation_conversions OWNER TO tanmay;

--
-- TOC entry 260 (class 1259 OID 67471)
-- Name: recommendation_metrics; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.recommendation_metrics (
    id uuid NOT NULL,
    user_id uuid,
    session_id character varying(100),
    recommendation_type character varying(50),
    recommended_products jsonb,
    viewed_products jsonb,
    clicked_products jsonb,
    added_to_cart jsonb,
    purchased_products jsonb,
    conversion_rate numeric(5,4),
    click_through_rate numeric(5,4),
    revenue_generated numeric(10,2),
    recommendation_context jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.recommendation_metrics OWNER TO tanmay;

--
-- TOC entry 245 (class 1259 OID 66976)
-- Name: report_schedules; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.report_schedules (
    id uuid NOT NULL,
    name character varying NOT NULL,
    report_type character varying NOT NULL,
    parameters json,
    schedule_cron character varying,
    recipients json,
    format character varying,
    enabled boolean,
    last_run timestamp with time zone,
    next_run timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.report_schedules OWNER TO tanmay;

--
-- TOC entry 230 (class 1259 OID 60876)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO tanmay;

--
-- TOC entry 220 (class 1259 OID 60788)
-- Name: roles; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.roles OWNER TO tanmay;

--
-- TOC entry 219 (class 1259 OID 60787)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: tanmay
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO tanmay;

--
-- TOC entry 5553 (class 0 OID 0)
-- Dependencies: 219
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tanmay
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 239 (class 1259 OID 61025)
-- Name: search_analytics; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.search_analytics (
    id uuid NOT NULL,
    user_id uuid,
    session_id character varying,
    query text NOT NULL,
    search_type character varying,
    results_count integer,
    clicked_product_id uuid,
    click_position integer,
    response_time_ms integer,
    filters_applied json,
    user_agent character varying,
    ip_address character varying,
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.search_analytics OWNER TO tanmay;

--
-- TOC entry 249 (class 1259 OID 67002)
-- Name: settings_backups; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.settings_backups (
    id integer NOT NULL,
    backup_id character varying(100) NOT NULL,
    settings_data text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by integer,
    description character varying(500),
    is_automatic boolean
);


ALTER TABLE public.settings_backups OWNER TO tanmay;

--
-- TOC entry 248 (class 1259 OID 67001)
-- Name: settings_backups_id_seq; Type: SEQUENCE; Schema: public; Owner: tanmay
--

CREATE SEQUENCE public.settings_backups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_backups_id_seq OWNER TO tanmay;

--
-- TOC entry 5554 (class 0 OID 0)
-- Dependencies: 248
-- Name: settings_backups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tanmay
--

ALTER SEQUENCE public.settings_backups_id_seq OWNED BY public.settings_backups.id;


--
-- TOC entry 253 (class 1259 OID 67031)
-- Name: settings_categories; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.settings_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(200) NOT NULL,
    description text,
    icon character varying(50),
    sort_order integer,
    is_active boolean,
    requires_restart boolean,
    access_level character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.settings_categories OWNER TO tanmay;

--
-- TOC entry 252 (class 1259 OID 67030)
-- Name: settings_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: tanmay
--

CREATE SEQUENCE public.settings_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_categories_id_seq OWNER TO tanmay;

--
-- TOC entry 5555 (class 0 OID 0)
-- Dependencies: 252
-- Name: settings_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tanmay
--

ALTER SEQUENCE public.settings_categories_id_seq OWNED BY public.settings_categories.id;


--
-- TOC entry 255 (class 1259 OID 67046)
-- Name: settings_change_log; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.settings_change_log (
    id integer NOT NULL,
    setting_id integer,
    category character varying(100) NOT NULL,
    key character varying(200) NOT NULL,
    old_value text,
    new_value text,
    change_type character varying(50) NOT NULL,
    changed_by integer NOT NULL,
    changed_at timestamp with time zone DEFAULT now(),
    ip_address character varying(45),
    user_agent character varying(500),
    reason text,
    backup_id character varying(100)
);


ALTER TABLE public.settings_change_log OWNER TO tanmay;

--
-- TOC entry 254 (class 1259 OID 67045)
-- Name: settings_change_log_id_seq; Type: SEQUENCE; Schema: public; Owner: tanmay
--

CREATE SEQUENCE public.settings_change_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_change_log_id_seq OWNER TO tanmay;

--
-- TOC entry 5556 (class 0 OID 0)
-- Dependencies: 254
-- Name: settings_change_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tanmay
--

ALTER SEQUENCE public.settings_change_log_id_seq OWNED BY public.settings_change_log.id;


--
-- TOC entry 266 (class 1259 OID 67569)
-- Name: system_alerts; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.system_alerts (
    id uuid NOT NULL,
    alert_type character varying(50) NOT NULL,
    severity character varying(20),
    title character varying(200) NOT NULL,
    description text,
    alert_data jsonb,
    source_component character varying(100),
    is_acknowledged boolean,
    is_resolved boolean,
    acknowledged_by uuid,
    resolved_by uuid,
    acknowledged_at timestamp with time zone,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_alerts OWNER TO tanmay;

--
-- TOC entry 242 (class 1259 OID 66947)
-- Name: system_alerts1; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.system_alerts1 (
    id uuid NOT NULL,
    type character varying NOT NULL,
    severity character varying NOT NULL,
    title character varying NOT NULL,
    message text,
    source character varying,
    alert_metadata json,
    resolved boolean,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    auto_resolve_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_alerts1 OWNER TO tanmay;

--
-- TOC entry 243 (class 1259 OID 66955)
-- Name: system_metrics; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.system_metrics (
    id uuid NOT NULL,
    metric_type character varying NOT NULL,
    metric_name character varying NOT NULL,
    value double precision NOT NULL,
    unit character varying,
    tags json,
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_metrics OWNER TO tanmay;

--
-- TOC entry 247 (class 1259 OID 66985)
-- Name: system_settings; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    category character varying(100) NOT NULL,
    key character varying(200) NOT NULL,
    value text NOT NULL,
    data_type character varying(50) NOT NULL,
    description text,
    validation_rules json,
    is_sensitive boolean,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    created_by integer,
    updated_by integer
);


ALTER TABLE public.system_settings OWNER TO tanmay;

--
-- TOC entry 241 (class 1259 OID 66350)
-- Name: system_settings1; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.system_settings1 (
    id uuid NOT NULL,
    category character varying NOT NULL,
    key character varying NOT NULL,
    value text,
    data_type character varying,
    description text,
    is_public boolean,
    requires_restart boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.system_settings1 OWNER TO tanmay;

--
-- TOC entry 246 (class 1259 OID 66984)
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: tanmay
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_id_seq OWNER TO tanmay;

--
-- TOC entry 5557 (class 0 OID 0)
-- Dependencies: 246
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tanmay
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- TOC entry 263 (class 1259 OID 67526)
-- Name: user_analytics_daily; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.user_analytics_daily (
    id uuid NOT NULL,
    user_id uuid,
    date date NOT NULL,
    page_views integer,
    search_queries integer,
    products_viewed integer,
    unique_products_viewed integer,
    cart_additions integer,
    cart_removals integer,
    wishlist_additions integer,
    session_duration_seconds integer,
    bounce_rate numeric(5,4),
    conversion_events integer,
    revenue_generated numeric(10,2),
    device_type character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_analytics_daily OWNER TO tanmay;

--
-- TOC entry 264 (class 1259 OID 67538)
-- Name: user_journey_events; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.user_journey_events (
    id uuid NOT NULL,
    user_id uuid,
    session_id character varying(100),
    event_type character varying(50) NOT NULL,
    event_data jsonb,
    page_url character varying(500),
    referrer character varying(500),
    user_agent character varying(1000),
    ip_address character varying(45),
    device_info jsonb,
    geolocation jsonb,
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_journey_events OWNER TO tanmay;

--
-- TOC entry 229 (class 1259 OID 60861)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_roles OWNER TO tanmay;

--
-- TOC entry 262 (class 1259 OID 67508)
-- Name: user_segment_memberships; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.user_segment_memberships (
    id uuid NOT NULL,
    user_id uuid,
    segment_id uuid,
    membership_score numeric(5,4),
    assigned_at timestamp with time zone DEFAULT now(),
    last_evaluated timestamp with time zone DEFAULT now(),
    is_active boolean,
    assignment_reason character varying(200)
);


ALTER TABLE public.user_segment_memberships OWNER TO tanmay;

--
-- TOC entry 261 (class 1259 OID 67486)
-- Name: user_segments; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.user_segments (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    segment_rules jsonb NOT NULL,
    segment_type character varying(50),
    is_active boolean,
    auto_update boolean,
    target_size integer,
    actual_size integer,
    last_updated timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE public.user_segments OWNER TO tanmay;

--
-- TOC entry 218 (class 1259 OID 60777)
-- Name: users; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    username character varying NOT NULL,
    email character varying NOT NULL,
    full_name character varying,
    hashed_password character varying NOT NULL,
    is_active boolean,
    is_superuser boolean,
    locale character varying,
    avatar_url character varying,
    interests character varying[],
    preferences json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    last_active timestamp with time zone,
    viewed_products uuid[],
    address json,
    phone character varying
);


ALTER TABLE public.users OWNER TO tanmay;

--
-- TOC entry 236 (class 1259 OID 60979)
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: tanmay
--

CREATE TABLE public.wishlist_items (
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    added_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.wishlist_items OWNER TO tanmay;

--
-- TOC entry 5155 (class 2604 OID 60841)
-- Name: currencies id; Type: DEFAULT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.currencies ALTER COLUMN id SET DEFAULT nextval('public.currencies_id_seq'::regclass);


--
-- TOC entry 5175 (class 2604 OID 67019)
-- Name: feature_flags id; Type: DEFAULT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.feature_flags ALTER COLUMN id SET DEFAULT nextval('public.feature_flags_id_seq'::regclass);


--
-- TOC entry 5156 (class 2604 OID 60853)
-- Name: languages id; Type: DEFAULT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.languages ALTER COLUMN id SET DEFAULT nextval('public.languages_id_seq'::regclass);


--
-- TOC entry 5151 (class 2604 OID 60804)
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- TOC entry 5149 (class 2604 OID 60791)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 5173 (class 2604 OID 67005)
-- Name: settings_backups id; Type: DEFAULT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.settings_backups ALTER COLUMN id SET DEFAULT nextval('public.settings_backups_id_seq'::regclass);


--
-- TOC entry 5177 (class 2604 OID 67034)
-- Name: settings_categories id; Type: DEFAULT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.settings_categories ALTER COLUMN id SET DEFAULT nextval('public.settings_categories_id_seq'::regclass);


--
-- TOC entry 5179 (class 2604 OID 67049)
-- Name: settings_change_log id; Type: DEFAULT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.settings_change_log ALTER COLUMN id SET DEFAULT nextval('public.settings_change_log_id_seq'::regclass);


--
-- TOC entry 5171 (class 2604 OID 66988)
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- TOC entry 5271 (class 2606 OID 66973)
-- Name: admin_activities admin_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.admin_activities
    ADD CONSTRAINT admin_activities_pkey PRIMARY KEY (id);


--
-- TOC entry 5320 (class 2606 OID 67431)
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- TOC entry 5316 (class 2606 OID 67277)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5259 (class 2606 OID 66329)
-- Name: cart_item cart_item_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_pkey PRIMARY KEY (id);


--
-- TOC entry 5246 (class 2606 OID 60968)
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (cart_id, product_id);


--
-- TOC entry 5237 (class 2606 OID 60915)
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- TOC entry 5239 (class 2606 OID 60917)
-- Name: carts carts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_key UNIQUE (user_id);


--
-- TOC entry 5215 (class 2606 OID 60847)
-- Name: currencies currencies_code_key; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_code_key UNIQUE (code);


--
-- TOC entry 5217 (class 2606 OID 60845)
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- TOC entry 5292 (class 2606 OID 67024)
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- TOC entry 5360 (class 2606 OID 67596)
-- Name: inventory_forecasts inventory_forecasts_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.inventory_forecasts
    ADD CONSTRAINT inventory_forecasts_pkey PRIMARY KEY (id);


--
-- TOC entry 5221 (class 2606 OID 60859)
-- Name: languages languages_code_key; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_code_key UNIQUE (code);


--
-- TOC entry 5223 (class 2606 OID 60857)
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (id);


--
-- TOC entry 5213 (class 2606 OID 60834)
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5324 (class 2606 OID 67439)
-- Name: ml_model_configs ml_model_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.ml_model_configs
    ADD CONSTRAINT ml_model_configs_pkey PRIMARY KEY (id);


--
-- TOC entry 5327 (class 2606 OID 67459)
-- Name: model_training_history model_training_history_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.model_training_history
    ADD CONSTRAINT model_training_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5244 (class 2606 OID 60957)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5254 (class 2606 OID 61014)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5242 (class 2606 OID 60930)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 5204 (class 2606 OID 60811)
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- TOC entry 5206 (class 2606 OID 60809)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5209 (class 2606 OID 60820)
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5250 (class 2606 OID 61002)
-- Name: product_config product_config_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.product_config
    ADD CONSTRAINT product_config_pkey PRIMARY KEY (id);


--
-- TOC entry 5252 (class 2606 OID 61004)
-- Name: product_config product_config_product_id_key; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.product_config
    ADD CONSTRAINT product_config_product_id_key UNIQUE (product_id);


--
-- TOC entry 5235 (class 2606 OID 60898)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 5352 (class 2606 OID 67561)
-- Name: recommendation_conversions recommendation_conversions_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.recommendation_conversions
    ADD CONSTRAINT recommendation_conversions_pkey PRIMARY KEY (id);


--
-- TOC entry 5331 (class 2606 OID 67478)
-- Name: recommendation_metrics recommendation_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.recommendation_metrics
    ADD CONSTRAINT recommendation_metrics_pkey PRIMARY KEY (id);


--
-- TOC entry 5275 (class 2606 OID 66983)
-- Name: report_schedules report_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.report_schedules
    ADD CONSTRAINT report_schedules_pkey PRIMARY KEY (id);


--
-- TOC entry 5227 (class 2606 OID 60880)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- TOC entry 5199 (class 2606 OID 60798)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 5201 (class 2606 OID 60796)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5257 (class 2606 OID 61032)
-- Name: search_analytics search_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.search_analytics
    ADD CONSTRAINT search_analytics_pkey PRIMARY KEY (id);


--
-- TOC entry 5290 (class 2606 OID 67010)
-- Name: settings_backups settings_backups_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.settings_backups
    ADD CONSTRAINT settings_backups_pkey PRIMARY KEY (id);


--
-- TOC entry 5304 (class 2606 OID 67039)
-- Name: settings_categories settings_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.settings_categories
    ADD CONSTRAINT settings_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5314 (class 2606 OID 67054)
-- Name: settings_change_log settings_change_log_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.settings_change_log
    ADD CONSTRAINT settings_change_log_pkey PRIMARY KEY (id);


--
-- TOC entry 5264 (class 2606 OID 66954)
-- Name: system_alerts1 system_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.system_alerts1
    ADD CONSTRAINT system_alerts_pkey PRIMARY KEY (id);


--
-- TOC entry 5358 (class 2606 OID 67576)
-- Name: system_alerts system_alerts_pkey1; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.system_alerts
    ADD CONSTRAINT system_alerts_pkey1 PRIMARY KEY (id);


--
-- TOC entry 5269 (class 2606 OID 66962)
-- Name: system_metrics system_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.system_metrics
    ADD CONSTRAINT system_metrics_pkey PRIMARY KEY (id);


--
-- TOC entry 5262 (class 2606 OID 66357)
-- Name: system_settings1 system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.system_settings1
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 5284 (class 2606 OID 66993)
-- Name: system_settings system_settings_pkey1; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey1 PRIMARY KEY (id);


--
-- TOC entry 5343 (class 2606 OID 67531)
-- Name: user_analytics_daily user_analytics_daily_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.user_analytics_daily
    ADD CONSTRAINT user_analytics_daily_pkey PRIMARY KEY (id);


--
-- TOC entry 5348 (class 2606 OID 67545)
-- Name: user_journey_events user_journey_events_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.user_journey_events
    ADD CONSTRAINT user_journey_events_pkey PRIMARY KEY (id);


--
-- TOC entry 5225 (class 2606 OID 60865)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- TOC entry 5340 (class 2606 OID 67514)
-- Name: user_segment_memberships user_segment_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.user_segment_memberships
    ADD CONSTRAINT user_segment_memberships_pkey PRIMARY KEY (id);


--
-- TOC entry 5335 (class 2606 OID 67495)
-- Name: user_segments user_segments_name_key; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.user_segments
    ADD CONSTRAINT user_segments_name_key UNIQUE (name);


--
-- TOC entry 5337 (class 2606 OID 67493)
-- Name: user_segments user_segments_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.user_segments
    ADD CONSTRAINT user_segments_pkey PRIMARY KEY (id);


--
-- TOC entry 5196 (class 2606 OID 60784)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5248 (class 2606 OID 60984)
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (user_id, product_id);


--
-- TOC entry 5285 (class 1259 OID 67012)
-- Name: idx_backup_automatic; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX idx_backup_automatic ON public.settings_backups USING btree (is_automatic);


--
-- TOC entry 5286 (class 1259 OID 67011)
-- Name: idx_backup_created_at; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX idx_backup_created_at ON public.settings_backups USING btree (created_at);


--
-- TOC entry 5298 (class 1259 OID 67040)
-- Name: idx_category_active; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX idx_category_active ON public.settings_categories USING btree (is_active);


--
-- TOC entry 5299 (class 1259 OID 67041)
-- Name: idx_category_order; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX idx_category_order ON public.settings_categories USING btree (sort_order);


--
-- TOC entry 5305 (class 1259 OID 67055)
-- Name: idx_change_log_date; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX idx_change_log_date ON public.settings_change_log USING btree (changed_at);


--
-- TOC entry 5306 (class 1259 OID 67062)
-- Name: idx_change_log_setting; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX idx_change_log_setting ON public.settings_change_log USING btree (category, key);


--
-- TOC entry 5307 (class 1259 OID 67061)
-- Name: idx_change_log_type; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX idx_change_log_type ON public.settings_change_log USING btree (change_type);


--
-- TOC entry 5308 (class 1259 OID 67056)
-- Name: idx_change_log_user; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX idx_change_log_user ON public.settings_change_log USING btree (changed_by);


--
-- TOC entry 5293 (class 1259 OID 67028)
-- Name: idx_feature_flag_enabled; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX idx_feature_flag_enabled ON public.feature_flags USING btree (is_enabled);


--
-- TOC entry 5294 (class 1259 OID 67029)
-- Name: idx_feature_flag_expires; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX idx_feature_flag_expires ON public.feature_flags USING btree (expires_at);


--
-- TOC entry 5276 (class 1259 OID 66997)
-- Name: idx_setting_active; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX idx_setting_active ON public.system_settings USING btree (is_active);


--
-- TOC entry 5277 (class 1259 OID 66996)
-- Name: idx_setting_category; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX idx_setting_category ON public.system_settings USING btree (category);


--
-- TOC entry 5278 (class 1259 OID 66999)
-- Name: idx_setting_category_key; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE UNIQUE INDEX idx_setting_category_key ON public.system_settings USING btree (category, key);


--
-- TOC entry 5272 (class 1259 OID 66975)
-- Name: ix_admin_activities_timestamp; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_admin_activities_timestamp ON public.admin_activities USING btree ("timestamp");


--
-- TOC entry 5273 (class 1259 OID 66974)
-- Name: ix_admin_activities_user_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_admin_activities_user_id ON public.admin_activities USING btree (user_id);


--
-- TOC entry 5317 (class 1259 OID 67283)
-- Name: ix_audit_logs_resource_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_audit_logs_resource_id ON public.audit_logs USING btree (resource_id);


--
-- TOC entry 5318 (class 1259 OID 67284)
-- Name: ix_audit_logs_resource_type; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_audit_logs_resource_type ON public.audit_logs USING btree (resource_type);


--
-- TOC entry 5260 (class 1259 OID 66340)
-- Name: ix_cart_product_unique; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE UNIQUE INDEX ix_cart_product_unique ON public.cart_item USING btree (cart_id, product_id);


--
-- TOC entry 5218 (class 1259 OID 60848)
-- Name: ix_currencies_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_currencies_id ON public.currencies USING btree (id);


--
-- TOC entry 5295 (class 1259 OID 67027)
-- Name: ix_feature_flags_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_feature_flags_id ON public.feature_flags USING btree (id);


--
-- TOC entry 5296 (class 1259 OID 67025)
-- Name: ix_feature_flags_is_enabled; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_feature_flags_is_enabled ON public.feature_flags USING btree (is_enabled);


--
-- TOC entry 5297 (class 1259 OID 67026)
-- Name: ix_feature_flags_name; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE UNIQUE INDEX ix_feature_flags_name ON public.feature_flags USING btree (name);


--
-- TOC entry 5219 (class 1259 OID 60860)
-- Name: ix_languages_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_languages_id ON public.languages USING btree (id);


--
-- TOC entry 5210 (class 1259 OID 60835)
-- Name: ix_logs_level_timestamp; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_logs_level_timestamp ON public.logs USING btree (level, "timestamp");


--
-- TOC entry 5211 (class 1259 OID 60836)
-- Name: ix_logs_logger_timestamp; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_logs_logger_timestamp ON public.logs USING btree (logger_name, "timestamp");


--
-- TOC entry 5321 (class 1259 OID 67450)
-- Name: ix_ml_model_configs_is_active; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_ml_model_configs_is_active ON public.ml_model_configs USING btree (is_active);


--
-- TOC entry 5322 (class 1259 OID 67451)
-- Name: ix_ml_model_configs_model_name; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_ml_model_configs_model_name ON public.ml_model_configs USING btree (model_name);


--
-- TOC entry 5325 (class 1259 OID 67470)
-- Name: ix_model_training_history_training_status; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_model_training_history_training_status ON public.model_training_history USING btree (training_status);


--
-- TOC entry 5240 (class 1259 OID 60936)
-- Name: ix_orders_order_number; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE UNIQUE INDEX ix_orders_order_number ON public.orders USING btree (order_number);


--
-- TOC entry 5202 (class 1259 OID 60812)
-- Name: ix_permissions_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_permissions_id ON public.permissions USING btree (id);


--
-- TOC entry 5207 (class 1259 OID 60826)
-- Name: ix_product_categories_name; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_product_categories_name ON public.product_categories USING btree (name);


--
-- TOC entry 5228 (class 1259 OID 60908)
-- Name: ix_products_brand; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_products_brand ON public.products USING btree (brand);


--
-- TOC entry 5229 (class 1259 OID 60907)
-- Name: ix_products_brand_category; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_products_brand_category ON public.products USING btree (brand, category_id);


--
-- TOC entry 5230 (class 1259 OID 60906)
-- Name: ix_products_code; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE UNIQUE INDEX ix_products_code ON public.products USING btree (code);


--
-- TOC entry 5231 (class 1259 OID 60905)
-- Name: ix_products_embedding_cosine; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_products_embedding_cosine ON public.products USING ivfflat (embedding public.vector_cosine_ops);


--
-- TOC entry 5232 (class 1259 OID 60909)
-- Name: ix_products_name; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_products_name ON public.products USING btree (name);


--
-- TOC entry 5233 (class 1259 OID 60904)
-- Name: ix_products_price_active; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_products_price_active ON public.products USING btree (price, is_active);


--
-- TOC entry 5349 (class 1259 OID 67567)
-- Name: ix_recommendation_conversions_recommendation_request_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_recommendation_conversions_recommendation_request_id ON public.recommendation_conversions USING btree (recommendation_request_id);


--
-- TOC entry 5350 (class 1259 OID 67568)
-- Name: ix_recommendation_conversions_session_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_recommendation_conversions_session_id ON public.recommendation_conversions USING btree (session_id);


--
-- TOC entry 5328 (class 1259 OID 67484)
-- Name: ix_recommendation_metrics_recommendation_type; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_recommendation_metrics_recommendation_type ON public.recommendation_metrics USING btree (recommendation_type);


--
-- TOC entry 5329 (class 1259 OID 67485)
-- Name: ix_recommendation_metrics_session_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_recommendation_metrics_session_id ON public.recommendation_metrics USING btree (session_id);


--
-- TOC entry 5197 (class 1259 OID 60799)
-- Name: ix_roles_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_roles_id ON public.roles USING btree (id);


--
-- TOC entry 5255 (class 1259 OID 61043)
-- Name: ix_search_analytics_session_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_search_analytics_session_id ON public.search_analytics USING btree (session_id);


--
-- TOC entry 5287 (class 1259 OID 67013)
-- Name: ix_settings_backups_backup_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE UNIQUE INDEX ix_settings_backups_backup_id ON public.settings_backups USING btree (backup_id);


--
-- TOC entry 5288 (class 1259 OID 67014)
-- Name: ix_settings_backups_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_settings_backups_id ON public.settings_backups USING btree (id);


--
-- TOC entry 5300 (class 1259 OID 67044)
-- Name: ix_settings_categories_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_settings_categories_id ON public.settings_categories USING btree (id);


--
-- TOC entry 5301 (class 1259 OID 67043)
-- Name: ix_settings_categories_is_active; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_settings_categories_is_active ON public.settings_categories USING btree (is_active);


--
-- TOC entry 5302 (class 1259 OID 67042)
-- Name: ix_settings_categories_name; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE UNIQUE INDEX ix_settings_categories_name ON public.settings_categories USING btree (name);


--
-- TOC entry 5309 (class 1259 OID 67060)
-- Name: ix_settings_change_log_category; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_settings_change_log_category ON public.settings_change_log USING btree (category);


--
-- TOC entry 5310 (class 1259 OID 67059)
-- Name: ix_settings_change_log_changed_at; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_settings_change_log_changed_at ON public.settings_change_log USING btree (changed_at);


--
-- TOC entry 5311 (class 1259 OID 67058)
-- Name: ix_settings_change_log_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_settings_change_log_id ON public.settings_change_log USING btree (id);


--
-- TOC entry 5312 (class 1259 OID 67057)
-- Name: ix_settings_change_log_key; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_settings_change_log_key ON public.settings_change_log USING btree (key);


--
-- TOC entry 5353 (class 1259 OID 67587)
-- Name: ix_system_alerts_alert_type; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_system_alerts_alert_type ON public.system_alerts USING btree (alert_type);


--
-- TOC entry 5354 (class 1259 OID 67588)
-- Name: ix_system_alerts_is_acknowledged; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_system_alerts_is_acknowledged ON public.system_alerts USING btree (is_acknowledged);


--
-- TOC entry 5355 (class 1259 OID 67589)
-- Name: ix_system_alerts_is_resolved; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_system_alerts_is_resolved ON public.system_alerts USING btree (is_resolved);


--
-- TOC entry 5356 (class 1259 OID 67590)
-- Name: ix_system_alerts_severity; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_system_alerts_severity ON public.system_alerts USING btree (severity);


--
-- TOC entry 5265 (class 1259 OID 66965)
-- Name: ix_system_metrics_metric_name; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_system_metrics_metric_name ON public.system_metrics USING btree (metric_name);


--
-- TOC entry 5266 (class 1259 OID 66964)
-- Name: ix_system_metrics_metric_type; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_system_metrics_metric_type ON public.system_metrics USING btree (metric_type);


--
-- TOC entry 5267 (class 1259 OID 66963)
-- Name: ix_system_metrics_timestamp; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_system_metrics_timestamp ON public.system_metrics USING btree ("timestamp");


--
-- TOC entry 5279 (class 1259 OID 66998)
-- Name: ix_system_settings_category; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_system_settings_category ON public.system_settings USING btree (category);


--
-- TOC entry 5280 (class 1259 OID 67000)
-- Name: ix_system_settings_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_system_settings_id ON public.system_settings USING btree (id);


--
-- TOC entry 5281 (class 1259 OID 66995)
-- Name: ix_system_settings_is_active; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_system_settings_is_active ON public.system_settings USING btree (is_active);


--
-- TOC entry 5282 (class 1259 OID 66994)
-- Name: ix_system_settings_key; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_system_settings_key ON public.system_settings USING btree (key);


--
-- TOC entry 5341 (class 1259 OID 67537)
-- Name: ix_user_analytics_daily_date; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_user_analytics_daily_date ON public.user_analytics_daily USING btree (date);


--
-- TOC entry 5344 (class 1259 OID 67551)
-- Name: ix_user_journey_events_event_type; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_user_journey_events_event_type ON public.user_journey_events USING btree (event_type);


--
-- TOC entry 5345 (class 1259 OID 67552)
-- Name: ix_user_journey_events_session_id; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_user_journey_events_session_id ON public.user_journey_events USING btree (session_id);


--
-- TOC entry 5346 (class 1259 OID 67553)
-- Name: ix_user_journey_events_timestamp; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_user_journey_events_timestamp ON public.user_journey_events USING btree ("timestamp");


--
-- TOC entry 5338 (class 1259 OID 67525)
-- Name: ix_user_segment_memberships_is_active; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_user_segment_memberships_is_active ON public.user_segment_memberships USING btree (is_active);


--
-- TOC entry 5332 (class 1259 OID 67506)
-- Name: ix_user_segments_is_active; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE INDEX ix_user_segments_is_active ON public.user_segments USING btree (is_active);


--
-- TOC entry 5333 (class 1259 OID 67507)
-- Name: ix_user_segments_name; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE UNIQUE INDEX ix_user_segments_name ON public.user_segments USING btree (name);


--
-- TOC entry 5193 (class 1259 OID 60785)
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- TOC entry 5194 (class 1259 OID 60786)
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: tanmay
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- TOC entry 5381 (class 2606 OID 67278)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5379 (class 2606 OID 66330)
-- Name: cart_item cart_item_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id);


--
-- TOC entry 5380 (class 2606 OID 66335)
-- Name: cart_item cart_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 5370 (class 2606 OID 60969)
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id);


--
-- TOC entry 5371 (class 2606 OID 60974)
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 5367 (class 2606 OID 60918)
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5396 (class 2606 OID 67597)
-- Name: inventory_forecasts inventory_forecasts_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.inventory_forecasts
    ADD CONSTRAINT inventory_forecasts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 5382 (class 2606 OID 67440)
-- Name: ml_model_configs ml_model_configs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.ml_model_configs
    ADD CONSTRAINT ml_model_configs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 5383 (class 2606 OID 67445)
-- Name: ml_model_configs ml_model_configs_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.ml_model_configs
    ADD CONSTRAINT ml_model_configs_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- TOC entry 5384 (class 2606 OID 67460)
-- Name: model_training_history model_training_history_initiated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.model_training_history
    ADD CONSTRAINT model_training_history_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES public.users(id);


--
-- TOC entry 5385 (class 2606 OID 67465)
-- Name: model_training_history model_training_history_model_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.model_training_history
    ADD CONSTRAINT model_training_history_model_config_id_fkey FOREIGN KEY (model_config_id) REFERENCES public.ml_model_configs(id);


--
-- TOC entry 5369 (class 2606 OID 60958)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5375 (class 2606 OID 61015)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 5376 (class 2606 OID 61020)
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 5368 (class 2606 OID 60931)
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5361 (class 2606 OID 60821)
-- Name: product_categories product_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.product_categories(id);


--
-- TOC entry 5374 (class 2606 OID 61005)
-- Name: product_config product_config_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.product_config
    ADD CONSTRAINT product_config_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 5366 (class 2606 OID 60899)
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id);


--
-- TOC entry 5393 (class 2606 OID 67562)
-- Name: recommendation_conversions recommendation_conversions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.recommendation_conversions
    ADD CONSTRAINT recommendation_conversions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5386 (class 2606 OID 67479)
-- Name: recommendation_metrics recommendation_metrics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.recommendation_metrics
    ADD CONSTRAINT recommendation_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5364 (class 2606 OID 60886)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- TOC entry 5365 (class 2606 OID 60881)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 5377 (class 2606 OID 61038)
-- Name: search_analytics search_analytics_clicked_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.search_analytics
    ADD CONSTRAINT search_analytics_clicked_product_id_fkey FOREIGN KEY (clicked_product_id) REFERENCES public.products(id);


--
-- TOC entry 5378 (class 2606 OID 61033)
-- Name: search_analytics search_analytics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.search_analytics
    ADD CONSTRAINT search_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5394 (class 2606 OID 67577)
-- Name: system_alerts system_alerts_acknowledged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.system_alerts
    ADD CONSTRAINT system_alerts_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES public.users(id);


--
-- TOC entry 5395 (class 2606 OID 67582)
-- Name: system_alerts system_alerts_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.system_alerts
    ADD CONSTRAINT system_alerts_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- TOC entry 5391 (class 2606 OID 67532)
-- Name: user_analytics_daily user_analytics_daily_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.user_analytics_daily
    ADD CONSTRAINT user_analytics_daily_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5392 (class 2606 OID 67546)
-- Name: user_journey_events user_journey_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.user_journey_events
    ADD CONSTRAINT user_journey_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5362 (class 2606 OID 60871)
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 5363 (class 2606 OID 60866)
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5389 (class 2606 OID 67515)
-- Name: user_segment_memberships user_segment_memberships_segment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.user_segment_memberships
    ADD CONSTRAINT user_segment_memberships_segment_id_fkey FOREIGN KEY (segment_id) REFERENCES public.user_segments(id);


--
-- TOC entry 5390 (class 2606 OID 67520)
-- Name: user_segment_memberships user_segment_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.user_segment_memberships
    ADD CONSTRAINT user_segment_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5387 (class 2606 OID 67496)
-- Name: user_segments user_segments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.user_segments
    ADD CONSTRAINT user_segments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 5388 (class 2606 OID 67501)
-- Name: user_segments user_segments_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.user_segments
    ADD CONSTRAINT user_segments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- TOC entry 5372 (class 2606 OID 60990)
-- Name: wishlist_items wishlist_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 5373 (class 2606 OID 60985)
-- Name: wishlist_items wishlist_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tanmay
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


-- Completed on 2025-07-26 16:44:56

--
-- PostgreSQL database dump complete
--

