# Data Engineering (Apache Spark & Airflow) Placement Preparation Guide

## Summary
Data engineering provides the foundational data pipelines, distributed processing engines, and analytical storage layers powering modern business intelligence, analytics, and machine learning platforms. Enterprise data systems ingest terabytes of structured and unstructured data, transforming raw events into clean, curated data lakehouses (e.g. Delta Lake, Apache Iceberg) via resilient DAG orchestrators like Apache Airflow.

In campus and lateral technical recruitment for Data Engineer and Analytics Engineer roles, candidates are rigorously tested on distributed compute fundamentals (Apache Spark internals, DAG execution, Catalyst optimizer), pipeline orchestration (Airflow operators, sensors, backfilling, idempotency), data modeling (star schema, snowflake schema, SCD Type 1/2), and partitioning/shuffling optimizations.

Engineers must understand how to avoid out-of-memory (OOM) errors, skew in distributed shuffles, small-file problems in cloud object stores (S3/ADLS/GCS), and pipeline state failures in mission-critical batch and streaming architectures.

## Key Concepts
- **Apache Spark Architecture & Execution Engine**: Driver vs. Executor node hierarchy, SparkSession, RDDs, DataFrames/Datasets, narrow vs. wide transformations, DAG scheduler, Catalyst query optimizer, and Tungsten off-heap memory management.
- **Partitioning, Shuffling & Skew Mitigation**: Partition pruning, broadcast hash joins vs. sort-merge joins, adaptive query execution (AQE), dealing with skewed data keys using salting, and optimizing `spark.sql.shuffle.partitions`.
- **Workflow Orchestration with Apache Airflow**: Directed Acyclic Graphs (DAGs), task dependencies (`>>`), Airflow Scheduler, Celery/Kubernetes Executors, Airflow variables vs. XComs, idempotent task design, SLAs, and historical backfills.
- **Data Lakehouse Architecture & Storage Formats**: Medallion architecture (Bronze ingestion, Silver cleaned/conformed, Gold aggregated), Parquet columnar storage with snappy compression, ACID transactions via Delta Lake/Apache Iceberg, and compaction strategies for small files.

## Worked Example: PySpark Medallion Pipeline with Broadcast Join Optimization
```python
"""PySpark Data Lakehouse ETL: Bronze to Silver Transformation.

Demonstrates broadcast hash joins, partition management, and parquet writing with schema validation.
"""
from pyspark.sql import SparkSession
from pyspark.sql.functions import broadcast, col, to_timestamp, when, current_timestamp
from pyspark.sql.types import DoubleType, IntegerType, StringType, StructField, StructType


def initialize_spark() -> SparkSession:
    """Configures high-throughput local or cluster SparkSession."""
    return (
        SparkSession.builder.appName("CareerForgeDataEngineeringPipeline")
        .config("spark.sql.adaptive.enabled", "true")
        .config("spark.sql.adaptive.skewJoin.enabled", "true")
        .config("spark.sql.shuffle.partitions", "16")
        .getOrCreate()
    )


def process_orders_silver_pipeline(spark: SparkSession, bronze_orders_path: str, dim_customers_path: str, silver_out_path: str) -> None:
    # Define explicit schema for raw ingestion
    raw_schema = StructType([
        StructField("order_id", StringType(), False),
        StructField("customer_id", StringType(), False),
        StructField("amount", DoubleType(), True),
        StructField("status", StringType(), True),
        StructField("timestamp_str", StringType(), True),
    ])

    # Ingest Bronze partition
    df_bronze = spark.read.schema(raw_schema).json(bronze_orders_path)

    # Ingest dimension lookup (small table optimized for broadcast)
    df_customers = spark.read.parquet(dim_customers_path)

    # Cleanse and cast
    df_cleaned = (
        df_bronze.filter(col("order_id").isNotNull() & (col("amount") > 0))
        .withColumn("order_timestamp", to_timestamp(col("timestamp_str"), "yyyy-MM-dd HH:mm:ss"))
        .withColumn("is_completed", when(col("status") == "DELIVERED", True).otherwise(False))
        .withColumn("processed_at", current_timestamp())
        .drop("timestamp_str")
    )

    # Perform Broadcast Hash Join to avoid expensive distributed shuffle
    df_silver = df_cleaned.join(
        broadcast(df_customers.select("customer_id", "tier", "region")),
        on="customer_id",
        how="left",
    )

    # Write out partitioned by date for partition pruning in downstream queries
    (
        df_silver.write.mode("overwrite")
        .partitionBy("region")
        .parquet(silver_out_path)
    )
    print(f"[+] Silver data layer written successfully to {silver_out_path}")


if __name__ == "__main__":
    spark = initialize_spark()
    # In production, invoked within Airflow PythonOperator or SparkSubmitOperator
```

## Common Interview Questions
1. *What is the difference between a Narrow transformation and a Wide transformation in Spark?* (Narrow transformations like `map` and `filter` operate on data within a single partition without network transfer; Wide transformations like `groupByKey`, `reduceByKey`, and `join` require a Shuffle across the cluster network to redistribute data into new partitions).
2. *How do you resolve Out Of Memory (OOM) errors caused by Data Skew in PySpark?* (Identify skewed keys using frequency analysis; implement salting by appending a random integer suffix to skewed join keys on both datasets to distribute data evenly across executor partitions, or enable Adaptive Query Execution (AQE) skew join optimization).
3. *Why is task idempotency critical when designing DAGs in Apache Airflow?* (If a task fails or needs backfilling, rerunning it must produce the exact same target state without duplicating records or corrupting tables. Idempotence is achieved using overwrite partition writes, staging tables, or database MERGE/UPSERT operations rather than blind appends).

## Documentation & Official Resources
- [Apache Spark Official Documentation](https://spark.apache.org/docs/latest/)
- [Apache Airflow Official Documentation](https://airflow.apache.org/docs/)
- [Delta Lake Documentation](https://docs.delta.io/latest/index.html)
